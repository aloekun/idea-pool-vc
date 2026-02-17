import { describe, it, expect, beforeEach } from 'vitest'
import { IdeaQueryAPI } from './idea-query-api.js'
import { ListIdeasUseCase } from '../usecases/list-ideas-use-case.js'
import { ShowIdeaUseCase } from '../usecases/show-idea-use-case.js'
import { ListIdeasRequest } from '../query/list-ideas-request.js'
import { ShowIdeaRequest } from '../query/show-idea-request.js'
import { MockIdeaRepository } from '../../infrastructure/testing/index.js'
import {
  Idea,
  Tag,
  TagCategory,
  Analysis,
  Suggestion,
} from '../../domain/index.js'

describe('IdeaQueryAPI', () => {
  let repository: MockIdeaRepository
  let api: IdeaQueryAPI

  beforeEach(() => {
    repository = new MockIdeaRepository()
    const listIdeasUseCase = new ListIdeasUseCase(repository)
    const showIdeaUseCase = new ShowIdeaUseCase(repository)
    api = new IdeaQueryAPI(listIdeasUseCase, showIdeaUseCase)
  })

  describe('listIdeas', () => {
    it('should return success response with empty list', async () => {
      const request = new ListIdeasRequest()
      const response = await api.listIdeas(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideas).toEqual([])
        expect(response.data.total).toBe(0)
      }
    })

    it('should return success response with ideas', async () => {
      await repository.save(Idea.create('Idea 1'))
      await repository.save(Idea.create('Idea 2'))

      const request = new ListIdeasRequest()
      const response = await api.listIdeas(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideas).toHaveLength(2)
        expect(response.data.total).toBe(2)
      }
    })

    it('should return IdeaSummary format in response', async () => {
      const idea = Idea.create('Test idea')
      await repository.save(idea)

      const request = new ListIdeasRequest()
      const response = await api.listIdeas(request)

      expect(response.success).toBe(true)
      if (response.success) {
        const summary = response.data.ideas[0]
        expect(summary.id).toBe(idea.id.value)
        expect(summary.content).toBe('Test idea')
        expect(summary.createdAt).toBeDefined()
        expect(summary.tagCount).toBe(0)
        expect(summary.chunkCount).toBe(0)
        expect(summary.hasAnalysis).toBe(false)
      }
    })

    it('should respect limit option', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.save(Idea.create(`Idea ${i}`))
      }

      const request = new ListIdeasRequest({ limit: 2 })
      const response = await api.listIdeas(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideas).toHaveLength(2)
        expect(response.data.total).toBe(2)
      }
    })

    it('should respect tag filter', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      await repository.save(Idea.create('Web idea').addTag(webTag))
      await repository.save(Idea.create('Other idea'))

      const request = new ListIdeasRequest({ tags: ['Web'] })
      const response = await api.listIdeas(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideas).toHaveLength(1)
        expect(response.data.ideas[0].content).toBe('Web idea')
      }
    })

    it('should respect archive filter', async () => {
      await repository.save(Idea.create('Active idea'))
      await repository.save(Idea.create('Archived idea').archive())

      const request = new ListIdeasRequest({ archived: true })
      const response = await api.listIdeas(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideas).toHaveLength(1)
        expect(response.data.ideas[0].content).toBe('Archived idea')
      }
    })

    it('should show all ideas with --all flag', async () => {
      await repository.save(Idea.create('Active idea'))
      await repository.save(Idea.create('Archived idea').archive())

      const request = new ListIdeasRequest({ all: true })
      const response = await api.listIdeas(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.ideas).toHaveLength(2)
      }
    })
  })

  describe('showIdea', () => {
    it('should return success response with idea detail', async () => {
      const idea = Idea.create('Detailed idea')
      await repository.save(idea)

      const request = new ShowIdeaRequest(idea.id.value)
      const response = await api.showIdea(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.id).toBe(idea.id.value)
        expect(response.data.content).toBe('Detailed idea')
        expect(response.data.chunks).toEqual([])
        expect(response.data.tags).toEqual([])
        expect(response.data.analyses).toEqual([])
      }
    })

    it('should include all related data in response', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      const suggestion = Suggestion.create('Do this', 'Because reasons')
      const analysis = Analysis.createWithSuggestion(suggestion, [webTag])

      let idea = Idea.create('Full idea')
      idea = idea.addChunk('Extra context')
      idea = idea.addTag(Tag.create('Large', TagCategory.scale()))
      idea = idea.addAnalysis(analysis)
      await repository.save(idea)

      const request = new ShowIdeaRequest(idea.id.value)
      const response = await api.showIdea(request)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.chunks).toHaveLength(1)
        expect(response.data.chunks[0].content).toBe('Extra context')
        expect(response.data.tags).toHaveLength(1)
        expect(response.data.tags[0]).toEqual({ name: 'Large', category: 'SCALE' })
        expect(response.data.analyses).toHaveLength(1)
        expect(response.data.analyses[0].suggestion).toEqual({
          content: 'Do this',
          reasoning: 'Because reasons',
        })
      }
    })

    it('should return NOT_FOUND error for non-existent idea', async () => {
      const request = new ShowIdeaRequest('01H5X8K2QJ3FT9VG0N6Y7MPWRS')
      const response = await api.showIdea(request)

      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error.code).toBe('NOT_FOUND')
        expect(response.error.message).toBeDefined()
      }
    })
  })
})
