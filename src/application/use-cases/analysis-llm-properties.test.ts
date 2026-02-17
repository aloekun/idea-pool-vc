import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { AnalyzeIdeaUseCase } from './analyze-idea-use-case.js'
import { SuggestActionUseCase } from './suggest-action-use-case.js'
import { MockIdeaRepository, MockLLMService } from '../../infrastructure/testing/index.js'
import { Idea, Analysis, Tag, TagCategory } from '../../domain/index.js'
import { isSuccess, isFailure } from '../../shared/index.js'
import { NUM_RUNS, nonEmptyStringArb } from './analysis-test-helpers.js'

describe('Feature: idea-classification-cli, Property 12: LLM service invocation', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let analyzeUseCase: AnalyzeIdeaUseCase
  let suggestUseCase: SuggestActionUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    analyzeUseCase = new AnalyzeIdeaUseCase(repository, llmService)
    suggestUseCase = new SuggestActionUseCase(repository, llmService)
  })

  it('should call LLM generateTags with correct parameters for any valid idea', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyStringArb, async (content) => {
        llmService.reset()
        repository.clear()

        const idea = Idea.create(content)
        await repository.save(idea)

        const result = await analyzeUseCase.execute(idea.id)

        expect(isSuccess(result)).toBe(true)

        const args = llmService.getLastGenerateTagsArgs()
        expect(args).not.toBeNull()
        expect(args!.ideaContent).toBe(content.trim())
        expect(args!.chunks).toEqual([])
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('should call LLM generateSuggestion with correct parameters for any valid idea with analysis', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyStringArb, async (content) => {
        llmService.reset()
        repository.clear()

        const tags = [Tag.create('Web', TagCategory.domain())]
        const analysis = Analysis.createWithTags(tags)

        let idea = Idea.create(content)
        idea = idea.addAnalysis(analysis)
        await repository.save(idea)

        const result = await suggestUseCase.execute(idea.id)

        expect(isSuccess(result)).toBe(true)

        const args = llmService.getLastGenerateSuggestionArgs()
        expect(args).not.toBeNull()
        expect(args!.ideaContent).toBe(content.trim())
        expect(args!.tags.length).toBe(1)
      }),
      { numRuns: NUM_RUNS }
    )
  })
})

describe('Feature: idea-classification-cli, Property 14: LLM communication error handling', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let analyzeUseCase: AnalyzeIdeaUseCase
  let suggestUseCase: SuggestActionUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    analyzeUseCase = new AnalyzeIdeaUseCase(repository, llmService)
    suggestUseCase = new SuggestActionUseCase(repository, llmService)
  })

  it('should return failure for any idea when LLM service fails during analyze', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyStringArb, async (content) => {
        llmService.reset()
        repository.clear()

        llmService.setShouldFail(true, 'Service unavailable')

        const idea = Idea.create(content)
        await repository.save(idea)

        const result = await analyzeUseCase.execute(idea.id)

        expect(isFailure(result)).toBe(true)
        if (result.isFailure) {
          expect(result.error.code).toBe('LLM_SERVICE_ERROR')
        }
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('should return failure for any idea when LLM service fails during suggest', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyStringArb, async (content) => {
        llmService.reset()
        repository.clear()

        const tags = [Tag.create('Web', TagCategory.domain())]
        const analysis = Analysis.createWithTags(tags)

        let idea = Idea.create(content)
        idea = idea.addAnalysis(analysis)
        await repository.save(idea)

        llmService.setShouldFail(true, 'Service unavailable')

        const result = await suggestUseCase.execute(idea.id)

        expect(isFailure(result)).toBe(true)
        if (result.isFailure) {
          expect(result.error.code).toBe('LLM_SERVICE_ERROR')
        }
      }),
      { numRuns: NUM_RUNS }
    )
  })
})
