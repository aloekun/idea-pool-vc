import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { IdeaId } from './idea-id.js'

describe('IdeaId', () => {
  describe('generate', () => {
    it('should generate a unique ID', () => {
      const id1 = IdeaId.generate()
      const id2 = IdeaId.generate()
      expect(id1.equals(id2)).toBe(false)
    })

    it('should generate a non-empty value', () => {
      const id = IdeaId.generate()
      expect(id.value).toBeTruthy()
      expect(id.value.length).toBeGreaterThan(0)
    })
  })

  describe('fromString', () => {
    it('should create IdeaId from valid string', () => {
      const id = IdeaId.fromString('test-id-123')
      expect(id.value).toBe('test-id-123')
    })

    it('should trim whitespace', () => {
      const id = IdeaId.fromString('  test-id  ')
      expect(id.value).toBe('test-id')
    })

    it('should throw error for empty string', () => {
      expect(() => IdeaId.fromString('')).toThrow('IdeaId cannot be empty')
    })

    it('should throw error for whitespace-only string', () => {
      expect(() => IdeaId.fromString('   ')).toThrow('IdeaId cannot be empty')
    })
  })

  describe('equals', () => {
    it('should return true for same value', () => {
      const id1 = IdeaId.fromString('same-id')
      const id2 = IdeaId.fromString('same-id')
      expect(id1.equals(id2)).toBe(true)
    })

    it('should return false for different values', () => {
      const id1 = IdeaId.fromString('id-1')
      const id2 = IdeaId.fromString('id-2')
      expect(id1.equals(id2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the value', () => {
      const id = IdeaId.fromString('test-id')
      expect(id.toString()).toBe('test-id')
    })
  })

  describe('Property: ID uniqueness', () => {
    it('each pair of generated IDs should be unique (10000 iterations)', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const id1 = IdeaId.generate()
          const id2 = IdeaId.generate()
          return !id1.equals(id2)
        }),
        { numRuns: 10_000 }
      )
    })
  })
})
