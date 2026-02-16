import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { success, failure, isSuccess, isFailure } from './result.js'

describe('Result', () => {
  describe('Success', () => {
    it('should create a success result', () => {
      const result = success(42)
      expect(result.isSuccess).toBe(true)
      expect(result.isFailure).toBe(false)
      expect(result.value).toBe(42)
    })

    it('should map value', () => {
      const result = success(2)
      const mapped = result.map((x) => x * 3)
      expect(isSuccess(mapped)).toBe(true)
      if (isSuccess(mapped)) {
        expect(mapped.value).toBe(6)
      }
    })

    it('should flatMap to another result', () => {
      const result = success(2)
      const flatMapped = result.flatMap((x) => success(x * 3))
      expect(isSuccess(flatMapped)).toBe(true)
      if (isSuccess(flatMapped)) {
        expect(flatMapped.value).toBe(6)
      }
    })

    it('should return value with getOrElse', () => {
      const result = success(42)
      expect(result.getOrElse(0)).toBe(42)
    })

    it('should return value with getOrThrow', () => {
      const result = success(42)
      expect(result.getOrThrow()).toBe(42)
    })
  })

  describe('Failure', () => {
    it('should create a failure result', () => {
      const result = failure('error')
      expect(result.isSuccess).toBe(false)
      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('error')
    })

    it('should not map value', () => {
      const result = failure<string>('error')
      const mapped = result.map((x: never) => x)
      expect(isFailure(mapped)).toBe(true)
      if (isFailure(mapped)) {
        expect(mapped.error).toBe('error')
      }
    })

    it('should not flatMap', () => {
      const result = failure<string>('error')
      const flatMapped = result.flatMap(() => success(42))
      expect(isFailure(flatMapped)).toBe(true)
      if (isFailure(flatMapped)) {
        expect(flatMapped.error).toBe('error')
      }
    })

    it('should return default with getOrElse', () => {
      const result = failure('error')
      expect(result.getOrElse(42)).toBe(42)
    })

    it('should throw with getOrThrow', () => {
      const result = failure('error')
      expect(() => result.getOrThrow()).toThrow('error')
    })
  })

  describe('type guards', () => {
    it('should identify success', () => {
      const result = success(42)
      expect(isSuccess(result)).toBe(true)
      expect(isFailure(result)).toBe(false)
    })

    it('should identify failure', () => {
      const result = failure('error')
      expect(isSuccess(result)).toBe(false)
      expect(isFailure(result)).toBe(true)
    })
  })

  describe('Property: Success map preserves success', () => {
    it('should preserve success after map (100 iterations)', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          fc.func(fc.integer()),
          (value, fn) => {
            const result = success(value).map(fn)
            return result.isSuccess
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property: Failure map preserves failure', () => {
    it('should preserve failure after map (100 iterations)', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (error) => {
            const result = failure(error).map(() => 42)
            return result.isFailure && result.error === error
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
