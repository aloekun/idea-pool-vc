import { describe, it, expect, beforeEach } from 'vitest'
import { IdeaCommandAPI } from './idea-command-api.js'
import { IdeaQueryAPI } from './idea-query-api.js'
import { IdeaAnalysisAPI } from './idea-analysis-api.js'
import { AddIdeaUseCase } from '../use-cases/add-idea-use-case.js'
import { AppendChunkUseCase } from '../use-cases/append-chunk-use-case.js'
import { AddTagUseCase } from '../use-cases/add-tag-use-case.js'
import { RemoveTagUseCase } from '../use-cases/remove-tag-use-case.js'
import { ArchiveIdeaUseCase } from '../use-cases/archive-idea-use-case.js'
import { RestoreIdeaUseCase } from '../use-cases/restore-idea-use-case.js'
import { ShowIdeaUseCase } from '../use-cases/show-idea-use-case.js'
import { ListIdeasUseCase } from '../use-cases/list-ideas-use-case.js'
import { AnalyzeIdeaUseCase } from '../use-cases/analyze-idea-use-case.js'
import { SuggestActionUseCase } from '../use-cases/suggest-action-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/mock-idea-repository.js'
import { MockLLMService } from '../../infrastructure/testing/mock-llm-service.js'
import { AddIdeaRequest } from '../requests/add-idea-request.js'
import { AppendChunkRequest } from '../requests/append-chunk-request.js'
import { AddTagRequest } from '../requests/add-tag-request.js'
import { RemoveTagRequest } from '../requests/remove-tag-request.js'
import { ArchiveIdeaRequest } from '../requests/archive-idea-request.js'
import { RestoreIdeaRequest } from '../requests/restore-idea-request.js'
import { ListIdeasRequest } from '../requests/list-ideas-request.js'
import { ShowIdeaRequest } from '../requests/show-idea-request.js'
import { AnalyzeIdeaRequest } from '../requests/analyze-idea-request.js'
import { SuggestActionRequest } from '../requests/suggest-action-request.js'

describe('IdeaCommandAPI', () => {
  let repository: MockIdeaRepository
  let commandAPI: IdeaCommandAPI

  beforeEach(() => {
    repository = new MockIdeaRepository()
    const showIdeaUseCase = new ShowIdeaUseCase(repository)
    commandAPI = new IdeaCommandAPI(
      new AddIdeaUseCase(repository),
      new AppendChunkUseCase(repository),
      new AddTagUseCase(repository),
      new RemoveTagUseCase(repository),
      new ArchiveIdeaUseCase(repository),
      new RestoreIdeaUseCase(repository),
      showIdeaUseCase
    )
  })

  describe('addIdea', () => {
    it('should return success response with idea details', async () => {
      const response = await commandAPI.addIdea(new AddIdeaRequest('Test idea'))

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBeTruthy()
        expect(response.data.content).toBe('Test idea')
        expect(response.data.createdAt).toBeTruthy()
      }
    })
  })

  describe('appendChunk', () => {
    it('should return success response with chunk details', async () => {
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('Base idea'))
      if (!addResponse.success) return

      const response = await commandAPI.appendChunk(
        new AppendChunkRequest(addResponse.data.ideaId, 'New chunk')
      )

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.chunkId).toBeTruthy()
        expect(response.data.content).toBe('New chunk')
      }
    })

    it('should return NOT_FOUND for nonexistent idea', async () => {
      const response = await commandAPI.appendChunk(
        new AppendChunkRequest('nonexistent', 'content')
      )

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('addTag', () => {
    it('should return success response', async () => {
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('Tag idea'))
      if (!addResponse.success) return

      const response = await commandAPI.addTag(
        new AddTagRequest(addResponse.data.ideaId, 'Web', 'DOMAIN')
      )

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.tag.name).toBe('Web')
        expect(response.data.tag.category).toBe('DOMAIN')
      }
    })

    it('should return error for invalid category', async () => {
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('Tag idea'))
      if (!addResponse.success) return

      const response = await commandAPI.addTag(
        new AddTagRequest(addResponse.data.ideaId, 'Web', 'INVALID')
      )

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('VALIDATION_ERROR')
      }
    })
  })

  describe('removeTag', () => {
    it('should return success response', async () => {
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('Tag idea'))
      if (!addResponse.success) return

      await commandAPI.addTag(
        new AddTagRequest(addResponse.data.ideaId, 'Web', 'DOMAIN')
      )

      const response = await commandAPI.removeTag(
        new RemoveTagRequest(addResponse.data.ideaId, 'Web')
      )

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.removedTagName).toBe('Web')
      }
    })

    it('should return NOT_FOUND for nonexistent tag', async () => {
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('Tag idea'))
      if (!addResponse.success) return

      const response = await commandAPI.removeTag(
        new RemoveTagRequest(addResponse.data.ideaId, 'Nonexistent')
      )

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('archiveIdea', () => {
    it('should return success response with archivedAt', async () => {
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('Archive idea'))
      if (!addResponse.success) return

      const response = await commandAPI.archiveIdea(
        new ArchiveIdeaRequest(addResponse.data.ideaId)
      )

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.archivedAt).toBeTruthy()
      }
    })
  })

  describe('restoreIdea', () => {
    it('should return success response', async () => {
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('Restore idea'))
      if (!addResponse.success) return

      await commandAPI.archiveIdea(new ArchiveIdeaRequest(addResponse.data.ideaId))
      const response = await commandAPI.restoreIdea(
        new RestoreIdeaRequest(addResponse.data.ideaId)
      )

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBe(addResponse.data.ideaId)
      }
    })
  })
})

describe('IdeaQueryAPI', () => {
  let repository: MockIdeaRepository
  let commandAPI: IdeaCommandAPI
  let queryAPI: IdeaQueryAPI

  beforeEach(() => {
    repository = new MockIdeaRepository()
    const showIdeaUseCase = new ShowIdeaUseCase(repository)
    commandAPI = new IdeaCommandAPI(
      new AddIdeaUseCase(repository),
      new AppendChunkUseCase(repository),
      new AddTagUseCase(repository),
      new RemoveTagUseCase(repository),
      new ArchiveIdeaUseCase(repository),
      new RestoreIdeaUseCase(repository),
      showIdeaUseCase
    )
    queryAPI = new IdeaQueryAPI(
      new ListIdeasUseCase(repository),
      showIdeaUseCase
    )
  })

  describe('listIdeas', () => {
    it('should return list of ideas', async () => {
      await commandAPI.addIdea(new AddIdeaRequest('Idea 1'))
      await commandAPI.addIdea(new AddIdeaRequest('Idea 2'))

      const response = await queryAPI.listIdeas(new ListIdeasRequest())

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideas).toHaveLength(2)
        expect(response.data.total).toBe(2)
      }
    })

    it('should respect limit', async () => {
      await commandAPI.addIdea(new AddIdeaRequest('Idea 1'))
      await commandAPI.addIdea(new AddIdeaRequest('Idea 2'))
      await commandAPI.addIdea(new AddIdeaRequest('Idea 3'))

      const response = await queryAPI.listIdeas(new ListIdeasRequest({ limit: 2 }))

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideas).toHaveLength(2)
      }
    })
  })

  describe('showIdea', () => {
    it('should return idea detail', async () => {
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('Detailed idea'))
      if (!addResponse.success) return

      const response = await queryAPI.showIdea(
        new ShowIdeaRequest(addResponse.data.ideaId)
      )

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.idea.content).toBe('Detailed idea')
        expect(response.data.idea.chunks).toEqual([])
        expect(response.data.idea.tags).toEqual([])
      }
    })

    it('should return NOT_FOUND for nonexistent idea', async () => {
      const response = await queryAPI.showIdea(new ShowIdeaRequest('nonexistent'))

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })
  })
})

describe('IdeaAnalysisAPI', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let commandAPI: IdeaCommandAPI
  let analysisAPI: IdeaAnalysisAPI

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    const showIdeaUseCase = new ShowIdeaUseCase(repository)
    commandAPI = new IdeaCommandAPI(
      new AddIdeaUseCase(repository),
      new AppendChunkUseCase(repository),
      new AddTagUseCase(repository),
      new RemoveTagUseCase(repository),
      new ArchiveIdeaUseCase(repository),
      new RestoreIdeaUseCase(repository),
      showIdeaUseCase
    )
    analysisAPI = new IdeaAnalysisAPI(
      new AnalyzeIdeaUseCase(repository, llmService),
      new SuggestActionUseCase(repository, llmService)
    )
  })

  describe('analyzeIdea', () => {
    it('should return analysis with generated tags', async () => {
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('Analyze this'))
      if (!addResponse.success) return

      const response = await analysisAPI.analyzeIdea(
        new AnalyzeIdeaRequest(addResponse.data.ideaId)
      )

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.analysisId).toBeTruthy()
        expect(response.data.generatedTags.length).toBeGreaterThan(0)
        expect(response.data.createdAt).toBeTruthy()
      }
    })

    it('should return NOT_FOUND for nonexistent idea', async () => {
      const response = await analysisAPI.analyzeIdea(
        new AnalyzeIdeaRequest('nonexistent')
      )

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })

    it('should return LLM_SERVICE_ERROR on failure', async () => {
      llmService.setShouldFail(true)
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('Test'))
      if (!addResponse.success) return

      const response = await analysisAPI.analyzeIdea(
        new AnalyzeIdeaRequest(addResponse.data.ideaId)
      )

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('LLM_SERVICE_ERROR')
      }
    })
  })

  describe('suggestAction', () => {
    it('should return suggestion', async () => {
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('Suggest for this'))
      if (!addResponse.success) return

      const analyzeResponse = await analysisAPI.analyzeIdea(
        new AnalyzeIdeaRequest(addResponse.data.ideaId)
      )
      if (!analyzeResponse.success) return

      const response = await analysisAPI.suggestAction(
        new SuggestActionRequest(addResponse.data.ideaId)
      )

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.suggestion.content).toBeTruthy()
        expect(response.data.suggestion.reasoning).toBeTruthy()
        expect(response.data.usedAnalysisId).toBeTruthy()
      }
    })

    it('should return NOT_FOUND when no analysis exists', async () => {
      const addResponse = await commandAPI.addIdea(new AddIdeaRequest('No analysis'))
      if (!addResponse.success) return

      const response = await analysisAPI.suggestAction(
        new SuggestActionRequest(addResponse.data.ideaId)
      )

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })
  })
})
