import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { MockIdeaRepository } from './mock-idea-repository.js'
import { Idea, IdeaId, Tag, TagCategory } from '../../domain/index.js'

describe('MockIdeaRepository', () => {
  let repository: MockIdeaRepository

  beforeEach(() => {
    repository = new MockIdeaRepository()
  })

  describe('save and findById', () => {
    it('should save and retrieve an idea', async () => {
      const idea = Idea.create('Test idea content')
      await repository.save(idea)

      const retrieved = await repository.findById(idea.id)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.content).toBe('Test idea content')
      expect(retrieved?.id.equals(idea.id)).toBe(true)
    })

    it('should return null for non-existent id', async () => {
      const idea = Idea.create('Test idea')
      const retrieved = await repository.findById(idea.id)

      expect(retrieved).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return all non-archived ideas in descending order', async () => {
      const now = new Date()
      const idea1 = Idea.reconstruct({
        id: IdeaId.generate(),
        content: 'First idea',
        createdAt: new Date(now.getTime() - 2000),
        archivedAt: null,
        chunks: [],
        tags: [],
        analyses: [],
      })
      const idea2 = Idea.reconstruct({
        id: IdeaId.generate(),
        content: 'Second idea',
        createdAt: new Date(now.getTime() - 1000),
        archivedAt: null,
        chunks: [],
        tags: [],
        analyses: [],
      })
      const idea3 = Idea.reconstruct({
        id: IdeaId.generate(),
        content: 'Third idea',
        createdAt: now,
        archivedAt: null,
        chunks: [],
        tags: [],
        analyses: [],
      })

      await repository.save(idea1)
      await repository.save(idea2)
      await repository.save(idea3)

      const all = await repository.findAll()

      expect(all).toHaveLength(3)
      expect(all[0].content).toBe('Third idea')
      expect(all[1].content).toBe('Second idea')
      expect(all[2].content).toBe('First idea')
    })

    it('should respect limit option', async () => {
      await repository.save(Idea.create('Idea 1'))
      await repository.save(Idea.create('Idea 2'))
      await repository.save(Idea.create('Idea 3'))

      const limited = await repository.findAll({ limit: 2 })

      expect(limited).toHaveLength(2)
    })

    it('should exclude archived ideas by default', async () => {
      const active = Idea.create('Active idea')
      const archived = Idea.create('Archived idea').archive()

      await repository.save(active)
      await repository.save(archived)

      const all = await repository.findAll()

      expect(all).toHaveLength(1)
      expect(all[0].content).toBe('Active idea')
    })
  })

  describe('findAllActive and findAllArchived', () => {
    it('should separate active and archived ideas', async () => {
      const active = Idea.create('Active idea')
      const archived = Idea.create('Archived idea').archive()

      await repository.save(active)
      await repository.save(archived)

      const activeIdeas = await repository.findAllActive()
      const archivedIdeas = await repository.findAllArchived()

      expect(activeIdeas).toHaveLength(1)
      expect(activeIdeas[0].content).toBe('Active idea')
      expect(archivedIdeas).toHaveLength(1)
      expect(archivedIdeas[0].content).toBe('Archived idea')
    })
  })

  describe('findByTags', () => {
    it('should find ideas by tag', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      const mobileTag = Tag.create('Mobile', TagCategory.domain())

      const webIdea = Idea.create('Web idea').addTag(webTag)
      const mobileIdea = Idea.create('Mobile idea').addTag(mobileTag)
      const bothIdea = Idea.create('Both idea').addTag(webTag).addTag(mobileTag)

      await repository.save(webIdea)
      await repository.save(mobileIdea)
      await repository.save(bothIdea)

      const webIdeas = await repository.findByTags(['Web'])

      expect(webIdeas).toHaveLength(2)
    })

    it('should find ideas with all specified tags (AND condition)', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      const largeTag = Tag.create('Large', TagCategory.scale())

      const webIdea = Idea.create('Web idea').addTag(webTag)
      const bothIdea = Idea.create('Both idea').addTag(webTag).addTag(largeTag)

      await repository.save(webIdea)
      await repository.save(bothIdea)

      const filtered = await repository.findByTags(['Web', 'Large'])

      expect(filtered).toHaveLength(1)
      expect(filtered[0].content).toBe('Both idea')
    })
  })

  describe('update', () => {
    it('should update an existing idea', async () => {
      const idea = Idea.create('Original content')
      await repository.save(idea)

      const updated = idea.addChunk('New chunk')
      await repository.update(updated)

      const retrieved = await repository.findById(idea.id)

      expect(retrieved?.chunks).toHaveLength(1)
      expect(retrieved?.chunks[0].content).toBe('New chunk')
    })

    it('should throw error for non-existent idea', async () => {
      const idea = Idea.create('Test idea')

      await expect(repository.update(idea)).rejects.toThrow()
    })
  })

  describe('utility methods', () => {
    it('should clear all ideas', async () => {
      await repository.save(Idea.create('Idea 1'))
      await repository.save(Idea.create('Idea 2'))

      repository.clear()

      expect(repository.count()).toBe(0)
    })

    it('should return correct count', async () => {
      expect(repository.count()).toBe(0)

      await repository.save(Idea.create('Idea 1'))
      expect(repository.count()).toBe(1)

      await repository.save(Idea.create('Idea 2'))
      expect(repository.count()).toBe(2)
    })
  })

  describe('Property 1: Idea save roundtrip', () => {
    it('should preserve idea content on save and retrieve (100 iterations)', async () => {
      const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0)

      await fc.assert(
        fc.asyncProperty(nonEmptyString, async (content) => {
          repository.clear()
          const idea = Idea.create(content)
          await repository.save(idea)

          const retrieved = await repository.findById(idea.id)

          return retrieved !== null && retrieved.content === content.trim()
        }),
        { numRuns: 100 }
      )
    })
  })
})
