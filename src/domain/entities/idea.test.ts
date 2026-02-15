import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Idea } from './idea.js'
import { Tag } from './tag.js'
import { Analysis } from './analysis.js'
import { TagCategory } from '../value-objects/index.js'

describe('Idea', () => {
  describe('create', () => {
    it('should create a new idea with content', () => {
      const idea = Idea.create('Test idea content')
      expect(idea.content).toBe('Test idea content')
      expect(idea.id.value).toBeTruthy()
      expect(idea.createdAt).toBeInstanceOf(Date)
      expect(idea.archivedAt).toBeNull()
      expect(idea.chunks).toHaveLength(0)
      expect(idea.tags).toHaveLength(0)
      expect(idea.analyses).toHaveLength(0)
    })

    it('should trim whitespace from content', () => {
      const idea = Idea.create('  Test idea  ')
      expect(idea.content).toBe('Test idea')
    })

    it('should throw error for empty content', () => {
      expect(() => Idea.create('')).toThrow('Idea content cannot be empty')
    })

    it('should throw error for whitespace-only content', () => {
      expect(() => Idea.create('   ')).toThrow('Idea content cannot be empty')
    })
  })

  describe('addChunk', () => {
    it('should add a new chunk', () => {
      const idea = Idea.create('Original idea')
      const updated = idea.addChunk('Additional content')

      expect(updated.chunks).toHaveLength(1)
      expect(updated.chunks[0].content).toBe('Additional content')
      expect(idea.chunks).toHaveLength(0)
    })

    it('should preserve original idea immutability', () => {
      const idea = Idea.create('Original idea')
      const updated = idea.addChunk('New chunk')

      expect(idea.chunks).toHaveLength(0)
      expect(updated.chunks).toHaveLength(1)
      expect(idea).not.toBe(updated)
    })
  })

  describe('addTag', () => {
    it('should add a new tag', () => {
      const idea = Idea.create('Test idea')
      const tag = Tag.create('Web', TagCategory.domain())
      const updated = idea.addTag(tag)

      expect(updated.tags).toHaveLength(1)
      expect(updated.tags[0].name).toBe('Web')
    })

    it('should not add duplicate tag', () => {
      const idea = Idea.create('Test idea')
      const tag = Tag.create('Web', TagCategory.domain())
      const updated = idea.addTag(tag).addTag(tag)

      expect(updated.tags).toHaveLength(1)
    })
  })

  describe('removeTag', () => {
    it('should remove existing tag', () => {
      const idea = Idea.create('Test idea')
      const tag = Tag.create('Web', TagCategory.domain())
      const withTag = idea.addTag(tag)
      const removed = withTag.removeTag(tag)

      expect(removed.tags).toHaveLength(0)
    })

    it('should do nothing when tag does not exist', () => {
      const idea = Idea.create('Test idea')
      const tag = Tag.create('Web', TagCategory.domain())
      const result = idea.removeTag(tag)

      expect(result.tags).toHaveLength(0)
      expect(result).toBe(idea)
    })
  })

  describe('archive and restore', () => {
    it('should archive an idea', () => {
      const idea = Idea.create('Test idea')
      const archived = idea.archive()

      expect(archived.isArchived()).toBe(true)
      expect(archived.archivedAt).toBeInstanceOf(Date)
    })

    it('should not change already archived idea', () => {
      const idea = Idea.create('Test idea')
      const archived = idea.archive()
      const result = archived.archive()

      expect(result).toBe(archived)
    })

    it('should restore an archived idea', () => {
      const idea = Idea.create('Test idea')
      const archived = idea.archive()
      const restored = archived.restore()

      expect(restored.isArchived()).toBe(false)
      expect(restored.archivedAt).toBeNull()
    })

    it('should not change non-archived idea on restore', () => {
      const idea = Idea.create('Test idea')
      const result = idea.restore()

      expect(result).toBe(idea)
    })
  })

  describe('addAnalysis', () => {
    it('should add a new analysis', () => {
      const idea = Idea.create('Test idea')
      const tag = Tag.create('Web', TagCategory.domain())
      const analysis = Analysis.createWithTags([tag])
      const updated = idea.addAnalysis(analysis)

      expect(updated.analyses).toHaveLength(1)
    })
  })

  describe('Property 4: Empty string input rejection', () => {
    it('should reject empty or whitespace-only strings (100 iterations)', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constant(' ')),
          (whitespace) => {
            try {
              Idea.create(whitespace)
              return false
            } catch {
              return true
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 6: Chunk addition immutability', () => {
    it('should not mutate original idea when adding chunks (100 iterations)', () => {
      const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0)
      fc.assert(
        fc.property(
          nonEmptyString,
          nonEmptyString,
          (content, chunkContent) => {
            const original = Idea.create(content)
            const originalChunksLength = original.chunks.length
            const updated = original.addChunk(chunkContent)

            return (
              original.chunks.length === originalChunksLength &&
              updated.chunks.length === originalChunksLength + 1 &&
              original !== updated
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 16: Tag add and remove roundtrip', () => {
    it('should return to original state after add and remove (100 iterations)', () => {
      const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0)
      fc.assert(
        fc.property(
          nonEmptyString,
          nonEmptyString,
          (ideaContent, tagName) => {
            const idea = Idea.create(ideaContent)
            const tag = Tag.create(tagName, TagCategory.domain())
            const withTag = idea.addTag(tag)
            const withoutTag = withTag.removeTag(tag)

            return withoutTag.tags.length === idea.tags.length
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
