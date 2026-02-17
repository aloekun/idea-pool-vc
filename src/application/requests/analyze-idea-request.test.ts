import { describe, it, expect } from 'vitest'
import { AnalyzeIdeaRequest } from './analyze-idea-request.js'
import { ValidationError } from '../../domain/index.js'

describe('AnalyzeIdeaRequest', () => {
  it('should create a valid request with a valid ideaId', () => {
    const request = new AnalyzeIdeaRequest('01ARZ3NDEKTSV4RRFFQ69G5FAV')
    expect(request.ideaId).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV')
  })

  it('should trim whitespace from ideaId', () => {
    const request = new AnalyzeIdeaRequest('  01ARZ3NDEKTSV4RRFFQ69G5FAV  ')
    expect(request.ideaId).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV')
  })

  it('should throw ValidationError when ideaId is empty string', () => {
    expect(() => new AnalyzeIdeaRequest('')).toThrow(ValidationError)
  })

  it('should throw ValidationError when ideaId is whitespace only', () => {
    expect(() => new AnalyzeIdeaRequest('   ')).toThrow(ValidationError)
  })

  it('should throw ValidationError with appropriate message', () => {
    expect(() => new AnalyzeIdeaRequest('')).toThrow(
      /ideaId|ID/i
    )
  })

  it('should have readonly ideaId property', () => {
    const request = new AnalyzeIdeaRequest('01ARZ3NDEKTSV4RRFFQ69G5FAV')
    expect(Object.isFrozen(request)).toBe(true)
  })
})
