import { describe, it, expect } from 'vitest'
import { SuggestActionRequest } from './suggest-action-request.js'
import { ValidationError } from '../../domain/index.js'

describe('SuggestActionRequest', () => {
  it('should create a valid request with ideaId only', () => {
    const request = new SuggestActionRequest('01ARZ3NDEKTSV4RRFFQ69G5FAV')
    expect(request.ideaId).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV')
    expect(request.analysisId).toBeUndefined()
  })

  it('should create a valid request with ideaId and analysisId', () => {
    const request = new SuggestActionRequest(
      '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      '01ARZ3NDEKTSV4RRFFQ69G5FAW'
    )
    expect(request.ideaId).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV')
    expect(request.analysisId).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAW')
  })

  it('should trim whitespace from ideaId', () => {
    const request = new SuggestActionRequest('  01ARZ3NDEKTSV4RRFFQ69G5FAV  ')
    expect(request.ideaId).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV')
  })

  it('should trim whitespace from analysisId', () => {
    const request = new SuggestActionRequest(
      '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      '  01ARZ3NDEKTSV4RRFFQ69G5FAW  '
    )
    expect(request.analysisId).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAW')
  })

  it('should throw ValidationError when ideaId is empty string', () => {
    expect(() => new SuggestActionRequest('')).toThrow(ValidationError)
  })

  it('should throw ValidationError when ideaId is whitespace only', () => {
    expect(() => new SuggestActionRequest('   ')).toThrow(ValidationError)
  })

  it('should throw ValidationError with appropriate message for empty ideaId', () => {
    expect(() => new SuggestActionRequest('')).toThrow(
      /ideaId|ID/i
    )
  })

  it('should accept undefined analysisId', () => {
    const request = new SuggestActionRequest('01ARZ3NDEKTSV4RRFFQ69G5FAV', undefined)
    expect(request.analysisId).toBeUndefined()
  })

  it('should throw ValidationError when analysisId is empty string', () => {
    expect(
      () => new SuggestActionRequest('01ARZ3NDEKTSV4RRFFQ69G5FAV', '')
    ).toThrow(ValidationError)
  })

  it('should throw ValidationError when analysisId is whitespace only', () => {
    expect(
      () => new SuggestActionRequest('01ARZ3NDEKTSV4RRFFQ69G5FAV', '   ')
    ).toThrow(ValidationError)
  })

  it('should have frozen properties', () => {
    const request = new SuggestActionRequest('01ARZ3NDEKTSV4RRFFQ69G5FAV')
    expect(Object.isFrozen(request)).toBe(true)
  })
})
