import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { ShowIdeaRequest } from './show-idea-request.js'

describe('ShowIdeaRequest', () => {
  describe('constructor', () => {
    it('should create with valid idea id', () => {
      const request = new ShowIdeaRequest('01H5X8K2QJ3FT9VG0N6Y7MPWRS')
      expect(request.ideaId).toBe('01H5X8K2QJ3FT9VG0N6Y7MPWRS')
    })

    it('should trim the idea id', () => {
      const request = new ShowIdeaRequest('  01H5X8K2QJ3FT9VG0N6Y7MPWRS  ')
      expect(request.ideaId).toBe('01H5X8K2QJ3FT9VG0N6Y7MPWRS')
    })
  })

  describe('validation', () => {
    it('should reject empty idea id', () => {
      expect(() => new ShowIdeaRequest('')).toThrow(
        'Idea ID is required'
      )
    })

    it('should reject whitespace-only idea id', () => {
      expect(() => new ShowIdeaRequest('   ')).toThrow(
        'Idea ID is required'
      )
    })
  })

  describe('immutability', () => {
    it('should be frozen', () => {
      const request = new ShowIdeaRequest('01H5X8K2QJ3FT9VG0N6Y7MPWRS')
      expect(Object.isFrozen(request)).toBe(true)
    })
  })

  describe('property-based tests', () => {
    it('should always accept non-empty strings as idea id', () => {
      const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0)

      fc.assert(
        fc.property(nonEmptyString, (id) => {
          const request = new ShowIdeaRequest(id)
          return request.ideaId === id.trim()
        }),
        { numRuns: 100 }
      )
    })

    it('should always reject empty/whitespace strings', () => {
      const emptyOrWhitespace = fc.oneof(
        fc.constant(''),
        fc.stringOf(fc.constant(' '))
      )

      fc.assert(
        fc.property(emptyOrWhitespace, (id) => {
          try {
            new ShowIdeaRequest(id)
            return false
          } catch {
            return true
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
