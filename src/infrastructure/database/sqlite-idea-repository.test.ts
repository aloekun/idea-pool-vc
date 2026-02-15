import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { DatabaseConnection } from './connection.js'
import { SQLiteIdeaRepository } from './sqlite-idea-repository.js'
import {
  Idea,
  Tag,
  Analysis,
  Suggestion,
  IdeaId,
  TagCategory,
} from '../../domain/index.js'

describe('SQLiteIdeaRepository', () => {
  let connection: DatabaseConnection
  let repository: SQLiteIdeaRepository

  beforeEach(() => {
    connection = DatabaseConnection.createInMemory()
    repository = new SQLiteIdeaRepository(connection)
  })

  afterEach(() => {
    connection.close()
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
      const id = IdeaId.generate()
      const retrieved = await repository.findById(id)

      expect(retrieved).toBeNull()
    })
  })

  describe('save with chunks', () => {
    it('should save idea with chunks', async () => {
      const idea = Idea.create('Test idea').addChunk('Chunk 1').addChunk('Chunk 2')
      await repository.save(idea)

      const retrieved = await repository.findById(idea.id)

      expect(retrieved?.chunks).toHaveLength(2)
      expect(retrieved?.chunks[0].content).toBe('Chunk 1')
      expect(retrieved?.chunks[1].content).toBe('Chunk 2')
    })
  })

  describe('save with tags', () => {
    it('should save idea with tags', async () => {
      const tag = Tag.create('Web', TagCategory.domain())
      const idea = Idea.create('Test idea').addTag(tag)
      await repository.save(idea)

      const retrieved = await repository.findById(idea.id)

      expect(retrieved?.tags).toHaveLength(1)
      expect(retrieved?.tags[0].name).toBe('Web')
      expect(retrieved?.tags[0].category.value).toBe('DOMAIN')
    })
  })

  describe('save with analyses', () => {
    it('should save idea with analyses', async () => {
      const tag = Tag.create('Web', TagCategory.domain())
      const analysis = Analysis.createWithTags([tag])
      const idea = Idea.create('Test idea').addAnalysis(analysis)
      await repository.save(idea)

      const retrieved = await repository.findById(idea.id)

      expect(retrieved?.analyses).toHaveLength(1)
      expect(retrieved?.analyses[0].generatedTags).toHaveLength(1)
    })

    it('should save idea with analysis containing suggestion', async () => {
      const tag = Tag.create('Web', TagCategory.domain())
      const suggestion = Suggestion.create('Try this', 'Because it works')
      const analysis = Analysis.createWithSuggestion(suggestion, [tag])
      const idea = Idea.create('Test idea').addAnalysis(analysis)
      await repository.save(idea)

      const retrieved = await repository.findById(idea.id)

      expect(retrieved?.analyses).toHaveLength(1)
      expect(retrieved?.analyses[0].suggestion?.content).toBe('Try this')
      expect(retrieved?.analyses[0].suggestion?.reasoning).toBe('Because it works')
    })
  })

  describe('findAll', () => {
    it('should return all ideas in descending order by createdAt', async () => {
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
      expect(all[2].content).toBe('First idea')
    })

    it('should respect limit option', async () => {
      await repository.save(Idea.create('Idea 1'))
      await repository.save(Idea.create('Idea 2'))
      await repository.save(Idea.create('Idea 3'))

      const limited = await repository.findAll({ limit: 2 })

      expect(limited).toHaveLength(2)
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
    it('should update idea content', async () => {
      const idea = Idea.create('Original content')
      await repository.save(idea)

      const updated = idea.addChunk('New chunk')
      await repository.update(updated)

      const retrieved = await repository.findById(idea.id)

      expect(retrieved?.chunks).toHaveLength(1)
      expect(retrieved?.chunks[0].content).toBe('New chunk')
    })

    it('should update archived status', async () => {
      const idea = Idea.create('Test idea')
      await repository.save(idea)

      const archived = idea.archive()
      await repository.update(archived)

      const retrieved = await repository.findById(idea.id)

      expect(retrieved?.isArchived()).toBe(true)
    })
  })

  describe('Property 1: Idea save roundtrip', () => {
    it('should preserve idea content on save and retrieve (100 iterations)', async () => {
      const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0)

      await fc.assert(
        fc.asyncProperty(nonEmptyString, async (content) => {
          const idea = Idea.create(content)
          await repository.save(idea)

          const retrieved = await repository.findById(idea.id)

          return retrieved !== null && retrieved.content === content.trim()
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 5: Chunk roundtrip', () => {
    it('should preserve chunk content on save and retrieve (100 iterations)', async () => {
      const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0)

      await fc.assert(
        fc.asyncProperty(nonEmptyString, nonEmptyString, async (ideaContent, chunkContent) => {
          const idea = Idea.create(ideaContent).addChunk(chunkContent)
          await repository.save(idea)

          const retrieved = await repository.findById(idea.id)

          return (
            retrieved !== null &&
            retrieved.chunks.length === 1 &&
            retrieved.chunks[0].content === chunkContent.trim()
          )
        }),
        { numRuns: 100 }
      )
    })
  })
})
