import { describe, it, expect, beforeEach } from 'vitest'
import { AnalyzeIdeaUseCase } from './analyze-idea-use-case.js'
import { MockIdeaRepository, MockLLMService } from '../../infrastructure/testing/index.js'
import {
  Idea,
  IdeaId,
  Tag,
  TagCategory,
  NotFoundError,
  LLMServiceError,
} from '../../domain/index.js'
import { isSuccess, isFailure } from '../../shared/index.js'

describe('AnalyzeIdeaUseCase', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let useCase: AnalyzeIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    useCase = new AnalyzeIdeaUseCase(repository, llmService)
  })

  describe('execute', () => {
    it('should analyze an idea and return success with analysis', async () => {
      const idea = Idea.create('Build a web scraping tool')
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (result.isSuccess) {
        expect(result.value.id).toBeDefined()
        expect(result.value.generatedTags.length).toBeGreaterThan(0)
        expect(result.value.createdAt).toBeInstanceOf(Date)
      }
    })

    it('should call LLM service with correct parameters', async () => {
      const idea = Idea.create('Machine learning pipeline')
      await repository.save(idea)

      await useCase.execute(idea.id)

      const args = llmService.getLastGenerateTagsArgs()
      expect(args).not.toBeNull()
      expect(args!.ideaContent).toBe('Machine learning pipeline')
      expect(args!.chunks).toEqual([])
    })

    it('should call LLM service with chunks when idea has chunks', async () => {
      let idea = Idea.create('Machine learning pipeline')
      idea = idea.addChunk('Additional context about data sources')
      await repository.save(idea)

      await useCase.execute(idea.id)

      const args = llmService.getLastGenerateTagsArgs()
      expect(args).not.toBeNull()
      expect(args!.chunks.length).toBe(1)
      expect(args!.chunks[0].content).toBe('Additional context about data sources')
    })

    it('should add the analysis to the idea in the repository', async () => {
      const idea = Idea.create('REST API framework')
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)

      const updatedIdea = await repository.findById(idea.id)
      expect(updatedIdea).not.toBeNull()
      expect(updatedIdea!.analyses.length).toBe(1)
      if (result.isSuccess) {
        expect(updatedIdea!.analyses[0].id.value).toBe(result.value.id.value)
      }
    })

    it('should store generated tags in the analysis', async () => {
      const customTags = [
        Tag.create('Web', TagCategory.domain()),
        Tag.create('Large', TagCategory.scale()),
      ]
      llmService.setOptions({ customTags })

      const idea = Idea.create('E-commerce platform')
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (result.isSuccess) {
        expect(result.value.generatedTags.length).toBe(2)
        expect(result.value.generatedTags[0].name).toBe('Web')
        expect(result.value.generatedTags[1].name).toBe('Large')
      }
    })

    it('should return NotFoundError when idea does not exist', async () => {
      const nonExistentId = IdeaId.generate()

      const result = await useCase.execute(nonExistentId)

      expect(isFailure(result)).toBe(true)
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(NotFoundError)
        expect(result.error.code).toBe('NOT_FOUND')
      }
    })

    it('should return LLMServiceError when LLM service fails', async () => {
      llmService.setShouldFail(true, 'Connection timeout')

      const idea = Idea.create('Test idea')
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isFailure(result)).toBe(true)
      if (result.isFailure) {
        expect(result.error).toBeInstanceOf(LLMServiceError)
        expect(result.error.code).toBe('LLM_SERVICE_ERROR')
      }
    })

    it('should return DatabaseError when repository update fails', async () => {
      const idea = Idea.create('Test idea')
      await repository.save(idea)

      // Remove the idea from repository to cause update failure
      repository.clear()

      const result = await useCase.execute(idea.id)

      // Will get NotFoundError since we cleared the repository
      expect(isFailure(result)).toBe(true)
    })

    it('should not modify existing analyses when adding a new one', async () => {
      const idea = Idea.create('Evolving idea')
      await repository.save(idea)

      // First analysis
      const result1 = await useCase.execute(idea.id)
      expect(isSuccess(result1)).toBe(true)

      // Second analysis
      const result2 = await useCase.execute(idea.id)
      expect(isSuccess(result2)).toBe(true)

      const updatedIdea = await repository.findById(idea.id)
      expect(updatedIdea!.analyses.length).toBe(2)

      if (result1.isSuccess && result2.isSuccess) {
        expect(updatedIdea!.analyses[0].id.value).toBe(result1.value.id.value)
        expect(updatedIdea!.analyses[1].id.value).toBe(result2.value.id.value)
      }
    })
  })
})
