import { describe, it, expect, beforeEach } from 'vitest'
import { IdeaCommandAPI } from './idea-command-api.js'
import { AddIdeaUseCase } from '../use-cases/add-idea-use-case.js'
import { AppendChunkUseCase } from '../use-cases/append-chunk-use-case.js'
import { AddTagUseCase } from '../use-cases/add-tag-use-case.js'
import { RemoveTagUseCase } from '../use-cases/remove-tag-use-case.js'
import { ArchiveIdeaUseCase } from '../use-cases/archive-idea-use-case.js'
import { RestoreIdeaUseCase } from '../use-cases/restore-idea-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/mock-idea-repository.js'
import { AddIdeaRequest, AppendChunkRequest, AddTagRequest, RemoveTagRequest, ArchiveIdeaRequest, RestoreIdeaRequest } from '../requests/command-requests.js'
import { Idea, Tag, TagCategory } from '../../domain/index.js'

describe('IdeaCommandAPI', () => {
  let repository: MockIdeaRepository
  let api: IdeaCommandAPI

  beforeEach(() => {
    repository = new MockIdeaRepository()
    api = new IdeaCommandAPI(
      new AddIdeaUseCase(repository),
      new AppendChunkUseCase(repository),
      new AddTagUseCase(repository),
      new RemoveTagUseCase(repository),
      new ArchiveIdeaUseCase(repository),
      new RestoreIdeaUseCase(repository)
    )
  })

  describe('addIdea', () => {
    it('should return success response with idea data', async () => {
      const request = new AddIdeaRequest('My new idea')
      const response = await api.addIdea(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBeTruthy()
        expect(response.data.content).toBe('My new idea')
        expect(response.data.createdAt).toBeTruthy()
      }
    })

    it('should return error response for empty content', async () => {
      const response = await api.addIdea({ content: '' } as AddIdeaRequest)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('VALIDATION_ERROR')
      }
    })
  })

  describe('appendChunk', () => {
    it('should return success response with chunk data', async () => {
      const idea = Idea.create('Test idea')
      await repository.save(idea)

      const request = new AppendChunkRequest(idea.id.value, 'Additional content')
      const response = await api.appendChunk(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBe(idea.id.value)
        expect(response.data.chunkId).toBeTruthy()
        expect(response.data.content).toBe('Additional content')
        expect(response.data.createdAt).toBeTruthy()
      }
    })

    it('should return error response for non-existent idea', async () => {
      const request = new AppendChunkRequest('nonexistent', 'content')
      const response = await api.appendChunk(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('addTag', () => {
    it('should return success response with tag data', async () => {
      const idea = Idea.create('Test idea')
      await repository.save(idea)

      const request = new AddTagRequest(idea.id.value, 'Web', 'DOMAIN')
      const response = await api.addTag(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBe(idea.id.value)
        expect(response.data.tag.name).toBe('Web')
        expect(response.data.tag.category).toBe('DOMAIN')
      }
    })

    it('should return error response for non-existent idea', async () => {
      const request = new AddTagRequest('nonexistent', 'Web', 'DOMAIN')
      const response = await api.addTag(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('removeTag', () => {
    it('should return success response after removing tag', async () => {
      const tag = Tag.create('Web', TagCategory.domain())
      const idea = Idea.create('Test idea').addTag(tag)
      await repository.save(idea)

      const request = new RemoveTagRequest(idea.id.value, 'Web')
      const response = await api.removeTag(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBe(idea.id.value)
        expect(response.data.removedTagName).toBe('Web')
      }
    })

    it('should return error response for non-existent idea', async () => {
      const request = new RemoveTagRequest('nonexistent', 'Web')
      const response = await api.removeTag(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('archiveIdea', () => {
    it('should return success response after archiving', async () => {
      const idea = Idea.create('Test idea')
      await repository.save(idea)

      const request = new ArchiveIdeaRequest(idea.id.value)
      const response = await api.archiveIdea(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBe(idea.id.value)
        expect(response.data.archivedAt).toBeTruthy()
      }
    })

    it('should return error response for non-existent idea', async () => {
      const request = new ArchiveIdeaRequest('nonexistent')
      const response = await api.archiveIdea(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('restoreIdea', () => {
    it('should return success response after restoring', async () => {
      const idea = Idea.create('Test idea').archive()
      await repository.save(idea)

      const request = new RestoreIdeaRequest(idea.id.value)
      const response = await api.restoreIdea(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBe(idea.id.value)
      }
    })

    it('should return error response for non-existent idea', async () => {
      const request = new RestoreIdeaRequest('nonexistent')
      const response = await api.restoreIdea(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })
  })
})
