import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Chunk } from './chunk.js'

describe('Chunk', () => {
  describe('create', () => {
    it('should create a new chunk with content', () => {
      const chunk = Chunk.create('Test chunk content')
      expect(chunk.content).toBe('Test chunk content')
      expect(chunk.id.value).toBeTruthy()
      expect(chunk.createdAt).toBeInstanceOf(Date)
    })

    it('should trim whitespace from content', () => {
      const chunk = Chunk.create('  Test chunk  ')
      expect(chunk.content).toBe('Test chunk')
    })

    it('should throw error for empty content', () => {
      expect(() => Chunk.create('')).toThrow('Chunk content cannot be empty')
    })

    it('should throw error for whitespace-only content', () => {
      expect(() => Chunk.create('   ')).toThrow('Chunk content cannot be empty')
    })
  })

  describe('equals', () => {
    it('should return false for different chunks', () => {
      const chunk1 = Chunk.create('Content 1')
      const chunk2 = Chunk.create('Content 2')
      expect(chunk1.equals(chunk2)).toBe(false)
    })
  })

  describe('Property 4: Empty string input rejection', () => {
    it('should reject empty or whitespace-only strings (100 iterations)', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constant(' ')),
          (whitespace) => {
            try {
              Chunk.create(whitespace)
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

  describe('Property 3: Entity creation timestamp', () => {
    it('should record createdAt timestamp on creation (100 iterations)', () => {
      const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0)
      fc.assert(
        fc.property(
          nonEmptyString,
          (content) => {
            const before = new Date()
            const chunk = Chunk.create(content)
            const after = new Date()

            return (
              chunk.createdAt >= before &&
              chunk.createdAt <= after
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
