import { describe, it, expect, beforeEach } from 'vitest'
import { ListIdeasUseCase } from './list-ideas-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/index.js'
import { Idea, IdeaId, Tag, TagCategory } from '../../domain/index.js'
import { isSuccess, isFailure } from '../../shared/result.js'

describe('ListIdeasUseCase', () => {
  let repository: MockIdeaRepository
  let useCase: ListIdeasUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    useCase = new ListIdeasUseCase(repository)
  })

  describe('basic listing', () => {
    it('should return empty list when no ideas exist', async () => {
      const result = await useCase.execute({})

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toEqual([])
      }
    })

    it('should return all active ideas', async () => {
      await repository.save(Idea.create('Idea 1'))
      await repository.save(Idea.create('Idea 2'))

      const result = await useCase.execute({})

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(2)
      }
    })

    it('should return IdeaSummary objects', async () => {
      const idea = Idea.create('Test idea with content')
      await repository.save(idea)

      const result = await useCase.execute({})

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        const summary = result.value[0]
        expect(summary.id).toBe(idea.id.value)
        expect(summary.content).toBe('Test idea with content')
        expect(summary.tagCount).toBe(0)
        expect(summary.chunkCount).toBe(0)
        expect(summary.hasAnalysis).toBe(false)
        expect(summary.archivedAt).toBeNull()
      }
    })
  })

  describe('sorting', () => {
    it('should sort ideas by createdAt descending', async () => {
      const now = new Date()
      const older = Idea.reconstruct({
        id: IdeaId.generate(),
        content: 'Older idea',
        createdAt: new Date(now.getTime() - 5000),
        archivedAt: null,
        chunks: [],
        tags: [],
        analyses: [],
      })
      const newer = Idea.reconstruct({
        id: IdeaId.generate(),
        content: 'Newer idea',
        createdAt: new Date(now.getTime() - 1000),
        archivedAt: null,
        chunks: [],
        tags: [],
        analyses: [],
      })

      await repository.save(older)
      await repository.save(newer)

      const result = await useCase.execute({})

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value[0].content).toBe('Newer idea')
        expect(result.value[1].content).toBe('Older idea')
      }
    })
  })

  describe('limit option', () => {
    it('should limit the number of results', async () => {
      for (let i = 0; i < 15; i++) {
        await repository.save(Idea.create(`Idea ${i}`))
      }

      const result = await useCase.execute({ limit: 5 })

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(5)
      }
    })

    it('should use default limit of 10 when not specified', async () => {
      for (let i = 0; i < 15; i++) {
        await repository.save(Idea.create(`Idea ${i}`))
      }

      const result = await useCase.execute({})

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(10)
      }
    })

    it('should return all if fewer than limit', async () => {
      await repository.save(Idea.create('Idea 1'))
      await repository.save(Idea.create('Idea 2'))

      const result = await useCase.execute({ limit: 10 })

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(2)
      }
    })
  })

  describe('tag filter', () => {
    it('should filter ideas by a single tag', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      const mobileTag = Tag.create('Mobile', TagCategory.domain())

      const webIdea = Idea.create('Web idea').addTag(webTag)
      const mobileIdea = Idea.create('Mobile idea').addTag(mobileTag)

      await repository.save(webIdea)
      await repository.save(mobileIdea)

      const result = await useCase.execute({ tags: ['Web'] })

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0].content).toBe('Web idea')
      }
    })

    it('should filter ideas by multiple tags (AND condition)', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      const largeTag = Tag.create('Large', TagCategory.scale())

      const webOnly = Idea.create('Web only').addTag(webTag)
      const both = Idea.create('Web and large').addTag(webTag).addTag(largeTag)

      await repository.save(webOnly)
      await repository.save(both)

      const result = await useCase.execute({ tags: ['Web', 'Large'] })

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0].content).toBe('Web and large')
      }
    })

    it('should return empty list when no ideas match tags', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      await repository.save(Idea.create('Web idea').addTag(webTag))

      const result = await useCase.execute({ tags: ['Mobile'] })

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(0)
      }
    })
  })

  describe('archive filter', () => {
    it('should show only active ideas by default', async () => {
      const active = Idea.create('Active idea')
      const archived = Idea.create('Archived idea').archive()

      await repository.save(active)
      await repository.save(archived)

      const result = await useCase.execute({})

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0].content).toBe('Active idea')
      }
    })

    it('should show only archived ideas when archivedOnly is true', async () => {
      const active = Idea.create('Active idea')
      const archived = Idea.create('Archived idea').archive()

      await repository.save(active)
      await repository.save(archived)

      const result = await useCase.execute({ archivedOnly: true })

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0].content).toBe('Archived idea')
        expect(result.value[0].archivedAt).not.toBeNull()
      }
    })

    it('should show all ideas when includeArchived is true', async () => {
      const active = Idea.create('Active idea')
      const archived = Idea.create('Archived idea').archive()

      await repository.save(active)
      await repository.save(archived)

      const result = await useCase.execute({ includeArchived: true })

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(2)
      }
    })
  })

  describe('content truncation', () => {
    it('should truncate content to 100 characters in summary', async () => {
      const longContent = 'A'.repeat(200)
      await repository.save(Idea.create(longContent))

      const result = await useCase.execute({})

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value[0].content).toBe('A'.repeat(100) + '...')
        expect(result.value[0].content.length).toBe(103)
      }
    })

    it('should not truncate short content', async () => {
      await repository.save(Idea.create('Short content'))

      const result = await useCase.execute({})

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value[0].content).toBe('Short content')
      }
    })
  })

  describe('combined filters', () => {
    it('should apply tag and limit filters together', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      for (let i = 0; i < 10; i++) {
        await repository.save(Idea.create(`Web idea ${i}`).addTag(webTag))
      }

      const result = await useCase.execute({ tags: ['Web'], limit: 3 })

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(3)
      }
    })
  })
})
