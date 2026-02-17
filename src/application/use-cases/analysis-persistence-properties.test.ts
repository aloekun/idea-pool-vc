import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { AnalyzeIdeaUseCase } from './analyze-idea-use-case.js'
import { SuggestActionUseCase } from './suggest-action-use-case.js'
import { MockIdeaRepository, MockLLMService } from '../../infrastructure/testing/index.js'
import {
  Idea,
  Analysis,
  Tag,
  TagCategory,
  Suggestion,
} from '../../domain/index.js'
import { isSuccess } from '../../shared/index.js'
import { NUM_RUNS, nonEmptyStringArb, tagArb } from './analysis-test-helpers.js'

describe('Feature: idea-classification-cli, Property 13: Tag save round-trip', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let analyzeUseCase: AnalyzeIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    analyzeUseCase = new AnalyzeIdeaUseCase(repository, llmService)
  })

  it('should preserve tags after analyze and retrieve for any valid tag set', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyStringArb,
        fc.array(tagArb, { minLength: 1, maxLength: 6 }),
        async (content, tagSpecs) => {
          llmService.reset()
          repository.clear()

          const customTags = tagSpecs.map((t) =>
            Tag.create(t.name.trim(), t.category)
          )
          llmService.setOptions({ customTags })

          const idea = Idea.create(content)
          await repository.save(idea)

          const result = await analyzeUseCase.execute(idea.id)
          expect(isSuccess(result)).toBe(true)

          if (result.isSuccess) {
            const savedIdea = await repository.findById(idea.id)
            expect(savedIdea).not.toBeNull()

            const savedAnalysis = savedIdea!.analyses[savedIdea!.analyses.length - 1]
            expect(savedAnalysis.generatedTags.length).toBe(customTags.length)

            for (let i = 0; i < customTags.length; i++) {
              expect(savedAnalysis.generatedTags[i].name).toBe(customTags[i].name)
              expect(savedAnalysis.generatedTags[i].category.value).toBe(
                customTags[i].category.value
              )
            }
          }
        }
      ),
      { numRuns: NUM_RUNS }
    )
  })
})

describe('Feature: idea-classification-cli, Property 17: Suggestion save round-trip', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let suggestUseCase: SuggestActionUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    suggestUseCase = new SuggestActionUseCase(repository, llmService)
  })

  it('should preserve suggestion after suggest and retrieve for any valid idea', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyStringArb,
        nonEmptyStringArb,
        nonEmptyStringArb,
        async (content, suggestionContent, suggestionReasoning) => {
          llmService.reset()
          repository.clear()

          const customSuggestion = Suggestion.create(
            suggestionContent,
            suggestionReasoning
          )
          llmService.setOptions({ customSuggestion })

          const tags = [Tag.create('Web', TagCategory.domain())]
          const analysis = Analysis.createWithTags(tags)

          let idea = Idea.create(content)
          idea = idea.addAnalysis(analysis)
          await repository.save(idea)

          const result = await suggestUseCase.execute(idea.id)
          expect(isSuccess(result)).toBe(true)

          if (result.isSuccess) {
            const savedIdea = await repository.findById(idea.id)
            expect(savedIdea).not.toBeNull()

            const lastAnalysis =
              savedIdea!.analyses[savedIdea!.analyses.length - 1]
            expect(lastAnalysis.suggestion).not.toBeNull()
            expect(lastAnalysis.suggestion!.content).toBe(
              suggestionContent.trim()
            )
            expect(lastAnalysis.suggestion!.reasoning).toBe(
              suggestionReasoning.trim()
            )
          }
        }
      ),
      { numRuns: NUM_RUNS }
    )
  })
})

describe('Feature: idea-classification-cli, Property 18: Analysis result addition', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let analyzeUseCase: AnalyzeIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    analyzeUseCase = new AnalyzeIdeaUseCase(repository, llmService)
  })

  it('should increase analysis count by one each time analyze is executed', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyStringArb,
        fc.integer({ min: 1, max: 5 }),
        async (content, analyzeCount) => {
          llmService.reset()
          repository.clear()

          const idea = Idea.create(content)
          await repository.save(idea)

          for (let i = 0; i < analyzeCount; i++) {
            const result = await analyzeUseCase.execute(idea.id)
            expect(isSuccess(result)).toBe(true)
          }

          const savedIdea = await repository.findById(idea.id)
          expect(savedIdea!.analyses.length).toBe(analyzeCount)
        }
      ),
      { numRuns: NUM_RUNS }
    )
  })
})

describe('Feature: idea-classification-cli, Property 19: Analysis addition immutability', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let analyzeUseCase: AnalyzeIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    analyzeUseCase = new AnalyzeIdeaUseCase(repository, llmService)
  })

  it('should not modify existing analyses when a new analysis is added', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyStringArb, async (content) => {
        llmService.reset()
        repository.clear()

        const idea = Idea.create(content)
        await repository.save(idea)

        const result1 = await analyzeUseCase.execute(idea.id)
        expect(isSuccess(result1)).toBe(true)

        const afterFirstAnalysis = await repository.findById(idea.id)
        const firstAnalysisSnapshot = {
          id: afterFirstAnalysis!.analyses[0].id.value,
          tagCount: afterFirstAnalysis!.analyses[0].generatedTags.length,
          tags: afterFirstAnalysis!.analyses[0].generatedTags.map((t) => ({
            name: t.name,
            category: t.category.value,
          })),
        }

        const result2 = await analyzeUseCase.execute(idea.id)
        expect(isSuccess(result2)).toBe(true)

        const afterSecondAnalysis = await repository.findById(idea.id)
        expect(afterSecondAnalysis!.analyses.length).toBe(2)

        const firstAnalysisAfterSecond = afterSecondAnalysis!.analyses[0]
        expect(firstAnalysisAfterSecond.id.value).toBe(
          firstAnalysisSnapshot.id
        )
        expect(firstAnalysisAfterSecond.generatedTags.length).toBe(
          firstAnalysisSnapshot.tagCount
        )

        for (let i = 0; i < firstAnalysisSnapshot.tags.length; i++) {
          expect(firstAnalysisAfterSecond.generatedTags[i].name).toBe(
            firstAnalysisSnapshot.tags[i].name
          )
          expect(
            firstAnalysisAfterSecond.generatedTags[i].category.value
          ).toBe(firstAnalysisSnapshot.tags[i].category)
        }
      }),
      { numRuns: NUM_RUNS }
    )
  })
})

describe('Feature: idea-classification-cli, Property 20: Analysis history chronological sort', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let analyzeUseCase: AnalyzeIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    analyzeUseCase = new AnalyzeIdeaUseCase(repository, llmService)
  })

  it('should maintain analyses in chronological order after multiple analyses', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyStringArb,
        fc.integer({ min: 2, max: 5 }),
        async (content, analyzeCount) => {
          llmService.reset()
          repository.clear()

          const idea = Idea.create(content)
          await repository.save(idea)

          for (let i = 0; i < analyzeCount; i++) {
            const result = await analyzeUseCase.execute(idea.id)
            expect(isSuccess(result)).toBe(true)
          }

          const savedIdea = await repository.findById(idea.id)
          const analyses = savedIdea!.analyses

          for (let i = 1; i < analyses.length; i++) {
            expect(
              analyses[i].createdAt.getTime()
            ).toBeGreaterThanOrEqual(analyses[i - 1].createdAt.getTime())
          }
        }
      ),
      { numRuns: NUM_RUNS }
    )
  })
})
