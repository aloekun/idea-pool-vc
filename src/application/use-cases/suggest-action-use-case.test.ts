import { describe, it, expect, beforeEach } from 'vitest'
import { SuggestActionUseCase } from './suggest-action-use-case.js'
import { MockIdeaRepository, MockLLMService } from '../../infrastructure/testing/index.js'
import {
  Idea,
  IdeaId,
  Analysis,
  AnalysisId,
  Tag,
  TagCategory,
  NotFoundError,
  LLMServiceError,
} from '../../domain/index.js'
import { isSuccess, isFailure } from '../../shared/index.js'

describe('SuggestActionUseCase', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let useCase: SuggestActionUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    useCase = new SuggestActionUseCase(repository, llmService)
  })

  function createIdeaWithAnalysis(): { idea: Idea; analysis: Analysis } {
    const tags = [
      Tag.create('Web', TagCategory.domain()),
      Tag.create('Medium', TagCategory.scale()),
    ]
    const analysis = Analysis.createWithTags(tags)
    let idea = Idea.create('Build a task management app')
    idea = idea.addAnalysis(analysis)
    return { idea, analysis }
  }

  describe('execute without analysisId', () => {
    it('should generate suggestion using latest analysis and return success', async () => {
      const { idea, analysis } = createIdeaWithAnalysis()
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (result.isSuccess) {
        expect(result.value.suggestion).toBeDefined()
        expect(result.value.suggestion.content).toBeDefined()
        expect(result.value.suggestion.reasoning).toBeDefined()
        expect(result.value.usedAnalysisId.equals(analysis.id)).toBe(true)
      }
    })

    it('should call LLM service with idea content, chunks, and tags from latest analysis', async () => {
      const { idea, analysis } = createIdeaWithAnalysis()
      await repository.save(idea)

      await useCase.execute(idea.id)

      const args = llmService.getLastGenerateSuggestionArgs()
      expect(args).not.toBeNull()
      expect(args!.ideaContent).toBe('Build a task management app')
      expect(args!.chunks).toEqual([])
      expect(args!.tags.length).toBe(analysis.generatedTags.length)
    })

    it('should use the most recent analysis when multiple exist', async () => {
      const tags1 = [Tag.create('Web', TagCategory.domain())]
      const analysis1 = Analysis.createWithTags(tags1)

      const tags2 = [
        Tag.create('Mobile', TagCategory.domain()),
        Tag.create('Large', TagCategory.scale()),
      ]
      const analysis2 = Analysis.createWithTags(tags2)

      let idea = Idea.create('Multi-platform app')
      idea = idea.addAnalysis(analysis1)
      idea = idea.addAnalysis(analysis2)
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (result.isSuccess) {
        expect(result.value.usedAnalysisId.equals(analysis2.id)).toBe(true)
      }

      const args = llmService.getLastGenerateSuggestionArgs()
      expect(args!.tags.length).toBe(2)
    })

    it('should add new analysis with suggestion to the idea', async () => {
      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)

      const updatedIdea = await repository.findById(idea.id)
      expect(updatedIdea!.analyses.length).toBe(2)

      const newAnalysis = updatedIdea!.analyses[1]
      expect(newAnalysis.suggestion).not.toBeNull()
    })

    it('should return NotFoundError when idea does not exist', async () => {
      const result = await useCase.execute(IdeaId.generate())

      expect(isFailure(result)).toBe(true)
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError)
      }
    })

    it('should return NotFoundError when idea has no analyses', async () => {
      const idea = Idea.create('Idea without analysis')
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isFailure(result)).toBe(true)
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError)
      }
    })

    it('should return LLMServiceError when LLM service fails', async () => {
      llmService.setShouldFail(true, 'Service unavailable')

      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isFailure(result)).toBe(true)
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(LLMServiceError)
      }
    })
  })

  describe('execute with analysisId', () => {
    it('should use the specified analysis when analysisId is provided', async () => {
      const tags1 = [Tag.create('Web', TagCategory.domain())]
      const analysis1 = Analysis.createWithTags(tags1)

      const tags2 = [Tag.create('Mobile', TagCategory.domain())]
      const analysis2 = Analysis.createWithTags(tags2)

      let idea = Idea.create('Multi-platform app')
      idea = idea.addAnalysis(analysis1)
      idea = idea.addAnalysis(analysis2)
      await repository.save(idea)

      // Use the first analysis specifically
      const result = await useCase.execute(idea.id, analysis1.id)

      expect(isSuccess(result)).toBe(true)
      if (result.isSuccess) {
        expect(result.value.usedAnalysisId.equals(analysis1.id)).toBe(true)
      }

      const args = llmService.getLastGenerateSuggestionArgs()
      expect(args!.tags.length).toBe(1)
      expect(args!.tags[0].name).toBe('Web')
    })

    it('should return NotFoundError when specified analysisId does not exist', async () => {
      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      const nonExistentAnalysisId = AnalysisId.generate()
      const result = await useCase.execute(idea.id, nonExistentAnalysisId)

      expect(isFailure(result)).toBe(true)
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError)
      }
    })

    it('should include chunks when generating suggestion', async () => {
      const tags = [Tag.create('Web', TagCategory.domain())]
      const analysis = Analysis.createWithTags(tags)

      let idea = Idea.create('Task app')
      idea = idea.addChunk('Should support real-time collaboration')
      idea = idea.addAnalysis(analysis)
      await repository.save(idea)

      await useCase.execute(idea.id)

      const args = llmService.getLastGenerateSuggestionArgs()
      expect(args!.chunks.length).toBe(1)
      expect(args!.chunks[0].content).toBe('Should support real-time collaboration')
    })
  })

  describe('result structure', () => {
    it('should return newAnalysisId, usedAnalysisId, and suggestion', async () => {
      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (result.isSuccess) {
        expect(result.value.newAnalysisId).toBeDefined()
        expect(result.value.usedAnalysisId).toBeDefined()
        expect(result.value.suggestion).toBeDefined()
        expect(result.value.createdAt).toBeInstanceOf(Date)
      }
    })
  })
})
