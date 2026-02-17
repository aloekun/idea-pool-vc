import { describe, it, expect } from 'vitest'
import {
  AddIdeaRequest,
  AppendChunkRequest,
  AddTagRequest,
  RemoveTagRequest,
  ArchiveIdeaRequest,
  RestoreIdeaRequest,
} from './command-requests.js'

describe('AddIdeaRequest', () => {
  it('should create a valid request with content', () => {
    const request = new AddIdeaRequest('My new idea')
    expect(request.content).toBe('My new idea')
  })

  it('should trim whitespace from content', () => {
    const request = new AddIdeaRequest('  My new idea  ')
    expect(request.content).toBe('My new idea')
  })

  it('should throw ValidationError for empty content', () => {
    expect(() => new AddIdeaRequest('')).toThrow()
  })

  it('should throw ValidationError for whitespace-only content', () => {
    expect(() => new AddIdeaRequest('   ')).toThrow()
  })

  it('should throw error with appropriate message', () => {
    expect(() => new AddIdeaRequest('')).toThrow('content')
  })

  it('should be immutable', () => {
    const request = new AddIdeaRequest('Test idea')
    expect(Object.isFrozen(request)).toBe(true)
  })
})

describe('AppendChunkRequest', () => {
  it('should create a valid request with ideaId and content', () => {
    const request = new AppendChunkRequest('abc123', 'Additional content')
    expect(request.ideaId).toBe('abc123')
    expect(request.content).toBe('Additional content')
  })

  it('should trim whitespace from both fields', () => {
    const request = new AppendChunkRequest('  abc123  ', '  content  ')
    expect(request.ideaId).toBe('abc123')
    expect(request.content).toBe('content')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new AppendChunkRequest('', 'content')).toThrow()
  })

  it('should throw ValidationError for whitespace-only ideaId', () => {
    expect(() => new AppendChunkRequest('   ', 'content')).toThrow()
  })

  it('should throw ValidationError for empty content', () => {
    expect(() => new AppendChunkRequest('abc123', '')).toThrow()
  })

  it('should throw ValidationError for whitespace-only content', () => {
    expect(() => new AppendChunkRequest('abc123', '   ')).toThrow()
  })

  it('should be immutable', () => {
    const request = new AppendChunkRequest('abc123', 'content')
    expect(Object.isFrozen(request)).toBe(true)
  })
})

describe('AddTagRequest', () => {
  it('should create a valid request', () => {
    const request = new AddTagRequest('abc123', 'Web', 'DOMAIN')
    expect(request.ideaId).toBe('abc123')
    expect(request.tagName).toBe('Web')
    expect(request.tagCategory).toBe('DOMAIN')
  })

  it('should trim whitespace from all fields', () => {
    const request = new AddTagRequest('  abc123  ', '  Web  ', '  DOMAIN  ')
    expect(request.ideaId).toBe('abc123')
    expect(request.tagName).toBe('Web')
    expect(request.tagCategory).toBe('DOMAIN')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new AddTagRequest('', 'Web', 'DOMAIN')).toThrow()
  })

  it('should throw ValidationError for empty tagName', () => {
    expect(() => new AddTagRequest('abc123', '', 'DOMAIN')).toThrow()
  })

  it('should throw ValidationError for empty tagCategory', () => {
    expect(() => new AddTagRequest('abc123', 'Web', '')).toThrow()
  })

  it('should throw ValidationError for invalid tagCategory', () => {
    expect(() => new AddTagRequest('abc123', 'Web', 'INVALID')).toThrow()
  })

  it('should accept case-insensitive category', () => {
    const request = new AddTagRequest('abc123', 'Web', 'domain')
    expect(request.tagCategory).toBe('DOMAIN')
  })

  it('should be immutable', () => {
    const request = new AddTagRequest('abc123', 'Web', 'DOMAIN')
    expect(Object.isFrozen(request)).toBe(true)
  })
})

describe('RemoveTagRequest', () => {
  it('should create a valid request', () => {
    const request = new RemoveTagRequest('abc123', 'Web')
    expect(request.ideaId).toBe('abc123')
    expect(request.tagName).toBe('Web')
  })

  it('should trim whitespace', () => {
    const request = new RemoveTagRequest('  abc123  ', '  Web  ')
    expect(request.ideaId).toBe('abc123')
    expect(request.tagName).toBe('Web')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new RemoveTagRequest('', 'Web')).toThrow()
  })

  it('should throw ValidationError for empty tagName', () => {
    expect(() => new RemoveTagRequest('abc123', '')).toThrow()
  })

  it('should be immutable', () => {
    const request = new RemoveTagRequest('abc123', 'Web')
    expect(Object.isFrozen(request)).toBe(true)
  })
})

describe('ArchiveIdeaRequest', () => {
  it('should create a valid request', () => {
    const request = new ArchiveIdeaRequest('abc123')
    expect(request.ideaId).toBe('abc123')
  })

  it('should trim whitespace', () => {
    const request = new ArchiveIdeaRequest('  abc123  ')
    expect(request.ideaId).toBe('abc123')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new ArchiveIdeaRequest('')).toThrow()
  })

  it('should throw ValidationError for whitespace-only ideaId', () => {
    expect(() => new ArchiveIdeaRequest('   ')).toThrow()
  })

  it('should be immutable', () => {
    const request = new ArchiveIdeaRequest('abc123')
    expect(Object.isFrozen(request)).toBe(true)
  })
})

describe('RestoreIdeaRequest', () => {
  it('should create a valid request', () => {
    const request = new RestoreIdeaRequest('abc123')
    expect(request.ideaId).toBe('abc123')
  })

  it('should trim whitespace', () => {
    const request = new RestoreIdeaRequest('  abc123  ')
    expect(request.ideaId).toBe('abc123')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new RestoreIdeaRequest('')).toThrow()
  })

  it('should throw ValidationError for whitespace-only ideaId', () => {
    expect(() => new RestoreIdeaRequest('   ')).toThrow()
  })

  it('should be immutable', () => {
    const request = new RestoreIdeaRequest('abc123')
    expect(Object.isFrozen(request)).toBe(true)
  })
})
