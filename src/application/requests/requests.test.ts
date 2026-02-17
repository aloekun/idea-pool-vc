import { describe, it, expect } from 'vitest'
import { AddIdeaRequest } from './add-idea-request.js'
import { AppendChunkRequest } from './append-chunk-request.js'
import { ListIdeasRequest } from './list-ideas-request.js'
import { ShowIdeaRequest } from './show-idea-request.js'
import { AnalyzeIdeaRequest } from './analyze-idea-request.js'
import { SuggestActionRequest } from './suggest-action-request.js'
import { AddTagRequest } from './add-tag-request.js'
import { RemoveTagRequest } from './remove-tag-request.js'
import { ArchiveIdeaRequest } from './archive-idea-request.js'
import { RestoreIdeaRequest } from './restore-idea-request.js'
import { ValidationError } from '../../domain/index.js'

describe('AddIdeaRequest', () => {
  it('should create with valid content', () => {
    const request = new AddIdeaRequest('My idea')
    expect(request.content).toBe('My idea')
  })

  it('should trim content', () => {
    const request = new AddIdeaRequest('  My idea  ')
    expect(request.content).toBe('My idea')
  })

  it('should throw ValidationError for empty content', () => {
    expect(() => new AddIdeaRequest('')).toThrow(ValidationError)
  })

  it('should throw ValidationError for whitespace-only content', () => {
    expect(() => new AddIdeaRequest('   ')).toThrow(ValidationError)
  })

  it('should be frozen', () => {
    const request = new AddIdeaRequest('My idea')
    expect(Object.isFrozen(request)).toBe(true)
  })
})

describe('AppendChunkRequest', () => {
  it('should create with valid inputs', () => {
    const request = new AppendChunkRequest('abc123', 'chunk content')
    expect(request.ideaId).toBe('abc123')
    expect(request.content).toBe('chunk content')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new AppendChunkRequest('', 'content')).toThrow(ValidationError)
  })

  it('should throw ValidationError for empty content', () => {
    expect(() => new AppendChunkRequest('abc123', '')).toThrow(ValidationError)
  })

  it('should trim both fields', () => {
    const request = new AppendChunkRequest('  abc  ', '  content  ')
    expect(request.ideaId).toBe('abc')
    expect(request.content).toBe('content')
  })
})

describe('ListIdeasRequest', () => {
  it('should create with defaults', () => {
    const request = new ListIdeasRequest()
    expect(request.limit).toBeUndefined()
    expect(request.tags).toEqual([])
    expect(request.includeArchived).toBe(false)
    expect(request.archivedOnly).toBe(false)
  })

  it('should create with options', () => {
    const request = new ListIdeasRequest({
      limit: 20,
      tags: ['Web'],
      archivedOnly: true,
    })
    expect(request.limit).toBe(20)
    expect(request.tags).toEqual(['Web'])
    expect(request.archivedOnly).toBe(true)
  })

  it('should throw ValidationError for limit < 1', () => {
    expect(() => new ListIdeasRequest({ limit: 0 })).toThrow(ValidationError)
    expect(() => new ListIdeasRequest({ limit: -1 })).toThrow(ValidationError)
  })
})

describe('ShowIdeaRequest', () => {
  it('should create with valid ideaId', () => {
    const request = new ShowIdeaRequest('abc123')
    expect(request.ideaId).toBe('abc123')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new ShowIdeaRequest('')).toThrow(ValidationError)
  })
})

describe('AnalyzeIdeaRequest', () => {
  it('should create with valid ideaId', () => {
    const request = new AnalyzeIdeaRequest('abc123')
    expect(request.ideaId).toBe('abc123')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new AnalyzeIdeaRequest('')).toThrow(ValidationError)
  })
})

describe('SuggestActionRequest', () => {
  it('should create with ideaId only', () => {
    const request = new SuggestActionRequest('abc123')
    expect(request.ideaId).toBe('abc123')
    expect(request.analysisId).toBeUndefined()
  })

  it('should create with ideaId and analysisId', () => {
    const request = new SuggestActionRequest('abc123', 'analysis456')
    expect(request.ideaId).toBe('abc123')
    expect(request.analysisId).toBe('analysis456')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new SuggestActionRequest('')).toThrow(ValidationError)
  })

  it('should set analysisId to undefined for empty string', () => {
    const request = new SuggestActionRequest('abc123', '')
    expect(request.analysisId).toBeUndefined()
  })
})

describe('AddTagRequest', () => {
  it('should create with valid inputs', () => {
    const request = new AddTagRequest('abc123', 'Web', 'DOMAIN')
    expect(request.ideaId).toBe('abc123')
    expect(request.tagName).toBe('Web')
    expect(request.tagCategory).toBe('DOMAIN')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new AddTagRequest('', 'Web', 'DOMAIN')).toThrow(ValidationError)
  })

  it('should throw ValidationError for empty tagName', () => {
    expect(() => new AddTagRequest('abc123', '', 'DOMAIN')).toThrow(ValidationError)
  })

  it('should throw ValidationError for empty tagCategory', () => {
    expect(() => new AddTagRequest('abc123', 'Web', '')).toThrow(ValidationError)
  })
})

describe('RemoveTagRequest', () => {
  it('should create with valid inputs', () => {
    const request = new RemoveTagRequest('abc123', 'Web')
    expect(request.ideaId).toBe('abc123')
    expect(request.tagName).toBe('Web')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new RemoveTagRequest('', 'Web')).toThrow(ValidationError)
  })

  it('should throw ValidationError for empty tagName', () => {
    expect(() => new RemoveTagRequest('abc123', '')).toThrow(ValidationError)
  })
})

describe('ArchiveIdeaRequest', () => {
  it('should create with valid ideaId', () => {
    const request = new ArchiveIdeaRequest('abc123')
    expect(request.ideaId).toBe('abc123')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new ArchiveIdeaRequest('')).toThrow(ValidationError)
  })
})

describe('RestoreIdeaRequest', () => {
  it('should create with valid ideaId', () => {
    const request = new RestoreIdeaRequest('abc123')
    expect(request.ideaId).toBe('abc123')
  })

  it('should throw ValidationError for empty ideaId', () => {
    expect(() => new RestoreIdeaRequest('')).toThrow(ValidationError)
  })
})
