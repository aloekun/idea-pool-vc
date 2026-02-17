import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { IdeaCommandAPI } from './idea-command-api.js'
import { AddIdeaUseCase } from '../use-cases/add-idea-use-case.js'
import { AppendChunkUseCase } from '../use-cases/append-chunk-use-case.js'
import { AddTagUseCase } from '../use-cases/add-tag-use-case.js'
import { RemoveTagUseCase } from '../use-cases/remove-tag-use-case.js'
import { ArchiveIdeaUseCase } from '../use-cases/archive-idea-use-case.js'
import { RestoreIdeaUseCase } from '../use-cases/restore-idea-use-case.js'
import { SQLiteIdeaRepository } from '../../infrastructure/database/sqlite-idea-repository.js'
import { DatabaseConnection } from '../../infrastructure/database/connection.js'
import {
  AddIdeaRequest,
  AppendChunkRequest,
  AddTagRequest,
  RemoveTagRequest,
  ArchiveIdeaRequest,
  RestoreIdeaRequest,
} from '../requests/command-requests.js'

// Integration tests using SQLite in-memory database.
// Exercises the full API boundary including real database operations.
describe('IdeaCommandAPI (integration)', () => {
  let connection: DatabaseConnection
  let repository: SQLiteIdeaRepository
  let api: IdeaCommandAPI

  beforeEach(() => {
    connection = DatabaseConnection.createInMemory()
    repository = new SQLiteIdeaRepository(connection)
    api = new IdeaCommandAPI(
      new AddIdeaUseCase(repository),
      new AppendChunkUseCase(repository),
      new AddTagUseCase(repository),
      new RemoveTagUseCase(repository),
      new ArchiveIdeaUseCase(repository),
      new RestoreIdeaUseCase(repository)
    )
  })

  afterEach(() => {
    connection.close()
  })

  describe('addIdea', () => {
    it('should persist idea and return success response', async () => {
      const request = new AddIdeaRequest('My new idea')
      const response = await api.addIdea(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBeTruthy()
        expect(response.data.content).toBe('My new idea')
        expect(response.data.createdAt).toBeTruthy()
      }
    })
  })

  describe('appendChunk', () => {
    it('should persist chunk and return success response', async () => {
      const addResponse = await api.addIdea(new AddIdeaRequest('Test idea'))
      expect(addResponse.success).toBe(true)
      if (!addResponse.success) return

      const request = new AppendChunkRequest(addResponse.data.ideaId, 'Additional content')
      const response = await api.appendChunk(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBe(addResponse.data.ideaId)
        expect(response.data.chunkId).toBeTruthy()
        expect(response.data.content).toBe('Additional content')
      }
    })

    it('should return error for non-existent idea', async () => {
      const request = new AppendChunkRequest('nonexistent', 'content')
      const response = await api.appendChunk(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('addTag', () => {
    it('should persist tag and return success response', async () => {
      const addResponse = await api.addIdea(new AddIdeaRequest('Test idea'))
      expect(addResponse.success).toBe(true)
      if (!addResponse.success) return

      const request = new AddTagRequest(addResponse.data.ideaId, 'Web', 'DOMAIN')
      const response = await api.addTag(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBe(addResponse.data.ideaId)
        expect(response.data.tag.name).toBe('Web')
        expect(response.data.tag.category).toBe('DOMAIN')
      }
    })
  })

  describe('removeTag', () => {
    it('should remove tag and return success response', async () => {
      const addResponse = await api.addIdea(new AddIdeaRequest('Test idea'))
      expect(addResponse.success).toBe(true)
      if (!addResponse.success) return

      await api.addTag(new AddTagRequest(addResponse.data.ideaId, 'Web', 'DOMAIN'))

      const request = new RemoveTagRequest(addResponse.data.ideaId, 'Web')
      const response = await api.removeTag(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.removedTagName).toBe('Web')
      }
    })
  })

  describe('archiveIdea', () => {
    it('should archive idea and return success response', async () => {
      const addResponse = await api.addIdea(new AddIdeaRequest('Test idea'))
      expect(addResponse.success).toBe(true)
      if (!addResponse.success) return

      const request = new ArchiveIdeaRequest(addResponse.data.ideaId)
      const response = await api.archiveIdea(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBe(addResponse.data.ideaId)
        expect(response.data.archivedAt).toBeTruthy()
      }
    })
  })

  describe('restoreIdea', () => {
    it('should restore archived idea and return success response', async () => {
      const addResponse = await api.addIdea(new AddIdeaRequest('Test idea'))
      expect(addResponse.success).toBe(true)
      if (!addResponse.success) return

      await api.archiveIdea(new ArchiveIdeaRequest(addResponse.data.ideaId))

      const request = new RestoreIdeaRequest(addResponse.data.ideaId)
      const response = await api.restoreIdea(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideaId).toBe(addResponse.data.ideaId)
      }
    })
  })
})
