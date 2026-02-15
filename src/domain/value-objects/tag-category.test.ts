import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { TagCategory, TAG_CATEGORIES } from './tag-category.js'

describe('TagCategory', () => {
  describe('fromString', () => {
    it.each(TAG_CATEGORIES)('should create category from valid string: %s', (category) => {
      const tagCategory = TagCategory.fromString(category)
      expect(tagCategory.value).toBe(category)
    })

    it('should be case-insensitive', () => {
      const tagCategory = TagCategory.fromString('nature')
      expect(tagCategory.value).toBe('NATURE')
    })

    it('should trim whitespace', () => {
      const tagCategory = TagCategory.fromString('  SCALE  ')
      expect(tagCategory.value).toBe('SCALE')
    })

    it('should throw error for invalid category', () => {
      expect(() => TagCategory.fromString('INVALID')).toThrow(
        'Invalid tag category: INVALID'
      )
    })
  })

  describe('factory methods', () => {
    it('should create NATURE category', () => {
      expect(TagCategory.nature().value).toBe('NATURE')
    })

    it('should create SCALE category', () => {
      expect(TagCategory.scale().value).toBe('SCALE')
    })

    it('should create DIFFICULTY category', () => {
      expect(TagCategory.difficulty().value).toBe('DIFFICULTY')
    })

    it('should create PHASE category', () => {
      expect(TagCategory.phase().value).toBe('PHASE')
    })

    it('should create RISK category', () => {
      expect(TagCategory.risk().value).toBe('RISK')
    })

    it('should create DOMAIN category', () => {
      expect(TagCategory.domain().value).toBe('DOMAIN')
    })
  })

  describe('equals', () => {
    it('should return true for same category', () => {
      const cat1 = TagCategory.nature()
      const cat2 = TagCategory.nature()
      expect(cat1.equals(cat2)).toBe(true)
    })

    it('should return false for different categories', () => {
      const cat1 = TagCategory.nature()
      const cat2 = TagCategory.scale()
      expect(cat1.equals(cat2)).toBe(false)
    })
  })

  describe('Property: all valid categories are accepted', () => {
    it('should accept all defined categories (100 iterations)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TAG_CATEGORIES),
          (category) => {
            const tagCategory = TagCategory.fromString(category)
            return tagCategory.value === category
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
