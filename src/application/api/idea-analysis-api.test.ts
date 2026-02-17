import { describe, it, expect, beforeEach } from 'vitest'
import { IdeaAnalysisAPI } from './idea-analysis-api.js'
import { AnalyzeIdeaUseCase } from '../use-cases/analyze-idea-use-case.js'
import { SuggestActionUseCase } from '../use-cases/suggest-action-use-case.js'
import { AnalyzeIdeaRequest } from '../requests/analyze-idea-request.js'
import { SuggestActionRequest } from '../requests/suggest-action-request.js'
import { MockIdeaRepository, MockLLMService } from '../../infrastructure/testing/index.js'
import { Idea, Analysis, Tag, TagCategory } from '../../domain/index.js'

describe('IdeaAnalysisAPI', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let analyzeUseCase: AnalyzeIdeaUseCase
  let suggestUseCase: SuggestActionUseCase
  let api: IdeaAnalysisAPI

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    analyzeUseCase = new AnalyzeIdeaUseCase(repository, llmService)
    suggestUseCase = new SuggestActionUseCase(repository, llmService)
    api = new IdeaAnalysisAPI(analyzeUseCase, suggestUseCase)
  })

  describe('analyzeIdea', () => {
    it('should return success response with analysis data', async () => {
      const idea = Idea.create('Build a web scraping tool')
      await repository.save(idea)

      const request = new AnalyzeIdeaRequest(idea.id.value)
      const response = await api.analyzeIdea(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.analysisId).toBeDefined()
        expect(response.data.generatedTags).toBeDefined()
        expect(response.data.generatedTags.length).toBeGreaterThan(0)
        expect(response.data.createdAt).toBeDefined()
        // Verify tag structure
        const tag = response.data.generatedTags[0]
        expect(tag.name).toBeDefined()
        expect(tag.category).toBeDefined()
      }
    })

    it('should return NOT_FOUND error for non-existent idea', async () => {
      const request = new AnalyzeIdeaRequest('01ARZ3NDEKTSV4RRFFQ69G5FAV')
      const response = await api.analyzeIdea(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })

    it('should return LLM_SERVICE_ERROR when LLM fails', async () => {
      llmService.setShouldFail(true)

      const idea = Idea.create('Test idea')
      await repository.save(idea)

      const request = new AnalyzeIdeaRequest(idea.id.value)
      const response = await api.analyzeIdea(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('LLM_SERVICE_ERROR')
      }
    })

    it('should return tags as TagDTO with name and category strings', async () => {
      const customTags = [
        Tag.create('Web', TagCategory.domain()),
        Tag.create('Large', TagCategory.scale()),
      ]
      llmService.setOptions({ customTags })

      const idea = Idea.create('E-commerce platform')
      await repository.save(idea)

      const request = new AnalyzeIdeaRequest(idea.id.value)
      const response = await api.analyzeIdea(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.generatedTags).toEqual([
          { name: 'Web', category: 'DOMAIN' },
          { name: 'Large', category: 'SCALE' },
        ])
      }
    })

    it('should return ISO 8601 formatted createdAt', async () => {
      const idea = Idea.create('Test idea')
      await repository.save(idea)

      const request = new AnalyzeIdeaRequest(idea.id.value)
      const response = await api.analyzeIdea(request)

      expect(response.success).toBe(true)
      if (response.success) {
        // Verify ISO 8601 format
        const date = new Date(response.data.createdAt)
        expect(date.toISOString()).toBe(response.data.createdAt)
      }
    })
  })

  describe('suggestAction', () => {
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

    it('should return success response with suggestion data', async () => {
      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      const request = new SuggestActionRequest(idea.id.value)
      const response = await api.suggestAction(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.analysisId).toBeDefined()
        expect(response.data.usedAnalysisId).toBeDefined()
        expect(response.data.suggestion).toBeDefined()
        expect(response.data.suggestion.content).toBeDefined()
        expect(response.data.suggestion.reasoning).toBeDefined()
        expect(response.data.createdAt).toBeDefined()
      }
    })

    it('should return NOT_FOUND error for non-existent idea', async () => {
      const request = new SuggestActionRequest('01ARZ3NDEKTSV4RRFFQ69G5FAV')
      const response = await api.suggestAction(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })

    it('should return NOT_FOUND when idea has no analyses', async () => {
      const idea = Idea.create('Idea without analysis')
      await repository.save(idea)

      const request = new SuggestActionRequest(idea.id.value)
      const response = await api.suggestAction(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })

    it('should return LLM_SERVICE_ERROR when LLM fails', async () => {
      llmService.setShouldFail(true)

      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      const request = new SuggestActionRequest(idea.id.value)
      const response = await api.suggestAction(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('LLM_SERVICE_ERROR')
      }
    })

    it('should use specific analysis when analysisId is provided', async () => {
      const tags1 = [Tag.create('Web', TagCategory.domain())]
      const analysis1 = Analysis.createWithTags(tags1)
      const tags2 = [Tag.create('Mobile', TagCategory.domain())]
      const analysis2 = Analysis.createWithTags(tags2)

      let idea = Idea.create('Multi-platform app')
      idea = idea.addAnalysis(analysis1)
      idea = idea.addAnalysis(analysis2)
      await repository.save(idea)

      const request = new SuggestActionRequest(
        idea.id.value,
        analysis1.id.value
      )
      const response = await api.suggestAction(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.usedAnalysisId).toBe(analysis1.id.value)
      }
    })

    it('should return NOT_FOUND when specified analysisId does not exist', async () => {
      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      const request = new SuggestActionRequest(
        idea.id.value,
        '01ARZ3NDEKTSV4RRFFQ69G5NONEXISTENT'
      )
      const response = await api.suggestAction(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })

    it('should return suggestion as SuggestionDTO', async () => {
      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      const request = new SuggestActionRequest(idea.id.value)
      const response = await api.suggestAction(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(typeof response.data.suggestion.content).toBe('string')
        expect(typeof response.data.suggestion.reasoning).toBe('string')
        expect(response.data.suggestion.content.length).toBeGreaterThan(0)
        expect(response.data.suggestion.reasoning.length).toBeGreaterThan(0)
      }
    })

    it('should return ISO 8601 formatted createdAt', async () => {
      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      const request = new SuggestActionRequest(idea.id.value)
      const response = await api.suggestAction(request)

      expect(response.success).toBe(true)
      if (response.success) {
        const date = new Date(response.data.createdAt)
        expect(date.toISOString()).toBe(response.data.createdAt)
      }
    })
  })
})
