import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { ListIdeasRequest } from './list-ideas-request.js'

describe('ListIdeasRequest', () => {
  describe('constructor with defaults', () => {
    it('should create with default values when no options given', () => {
      const request = new ListIdeasRequest()

      expect(request.limit).toBe(10)
      expect(request.tags).toEqual([])
      expect(request.archiveFilter).toBe('active')
    })
  })

  describe('limit option', () => {
    it('should accept a positive integer limit', () => {
      const request = new ListIdeasRequest({ limit: 20 })
      expect(request.limit).toBe(20)
    })

    it('should accept limit of 1', () => {
      const request = new ListIdeasRequest({ limit: 1 })
      expect(request.limit).toBe(1)
    })

    it('should reject limit of 0', () => {
      expect(() => new ListIdeasRequest({ limit: 0 })).toThrow(
        'limit must be a positive integer'
      )
    })

    it('should reject negative limit', () => {
      expect(() => new ListIdeasRequest({ limit: -5 })).toThrow(
        'limit must be a positive integer'
      )
    })

    it('should reject non-integer limit', () => {
      expect(() => new ListIdeasRequest({ limit: 2.5 })).toThrow(
        'limit must be a positive integer'
      )
    })
  })

  describe('tag filter option', () => {
    it('should accept a single tag', () => {
      const request = new ListIdeasRequest({ tags: ['Web'] })
      expect(request.tags).toEqual(['Web'])
    })

    it('should accept multiple tags', () => {
      const request = new ListIdeasRequest({ tags: ['Web', 'Large'] })
      expect(request.tags).toEqual(['Web', 'Large'])
    })

    it('should trim tag names', () => {
      const request = new ListIdeasRequest({ tags: ['  Web  ', '  Large  '] })
      expect(request.tags).toEqual(['Web', 'Large'])
    })

    it('should reject empty tag names', () => {
      expect(() => new ListIdeasRequest({ tags: [''] })).toThrow(
        'Tag name cannot be empty'
      )
    })

    it('should reject whitespace-only tag names', () => {
      expect(() => new ListIdeasRequest({ tags: ['   '] })).toThrow(
        'Tag name cannot be empty'
      )
    })

    it('should deduplicate tags', () => {
      const request = new ListIdeasRequest({ tags: ['Web', 'Web', 'Large'] })
      expect(request.tags).toEqual(['Web', 'Large'])
    })
  })

  describe('archive filter option', () => {
    it('should default to active filter', () => {
      const request = new ListIdeasRequest()
      expect(request.archiveFilter).toBe('active')
    })

    it('should accept archived filter', () => {
      const request = new ListIdeasRequest({ archived: true })
      expect(request.archiveFilter).toBe('archived')
    })

    it('should accept all filter', () => {
      const request = new ListIdeasRequest({ all: true })
      expect(request.archiveFilter).toBe('all')
    })

    it('should prioritize all over archived', () => {
      const request = new ListIdeasRequest({ archived: true, all: true })
      expect(request.archiveFilter).toBe('all')
    })
  })

  describe('immutability', () => {
    it('should not allow modification of tags array', () => {
      const request = new ListIdeasRequest({ tags: ['Web'] })
      expect(Object.isFrozen(request)).toBe(true)
    })
  })

  describe('combined options', () => {
    it('should accept all options together', () => {
      const request = new ListIdeasRequest({
        limit: 5,
        tags: ['Web', 'Large'],
        archived: true,
      })

      expect(request.limit).toBe(5)
      expect(request.tags).toEqual(['Web', 'Large'])
      expect(request.archiveFilter).toBe('archived')
    })
  })

  describe('property-based tests', () => {
    it('should always accept positive integer limits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (limit) => {
            const request = new ListIdeasRequest({ limit })
            return request.limit === limit
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should always reject non-positive limits', () => {
      fc.assert(
        fc.property(
          fc.integer({ max: 0 }),
          (limit) => {
            try {
              new ListIdeasRequest({ limit })
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
})
