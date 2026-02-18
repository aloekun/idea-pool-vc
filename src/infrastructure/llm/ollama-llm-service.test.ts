import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OllamaLLMService } from './ollama-llm-service.js'
import { LLMServiceError, TagCategory } from '../../domain/index.js'
import { Chunk, ChunkId } from '../../domain/index.js'

// Helper to create a mock Chunk
function makeChunk(content: string): Chunk {
  return Chunk.reconstruct({
    id: ChunkId.generate(),
    content,
    createdAt: new Date(),
  })
}

// Helper to build a mock fetch response
function mockFetchResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Internal Server Error',
    json: () => Promise.resolve(body),
  } as unknown as Response
}

describe('OllamaLLMService', () => {
  let service: OllamaLLMService
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    service = new OllamaLLMService('http://localhost:11434', 'llama3.2', {
      connectionTimeoutMs: 1_000,
      generateTimeoutMs: 5_000,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ---------------------------------------------------------------------------
  // generateTags
  // ---------------------------------------------------------------------------

  describe('generateTags', () => {
    const validTagsPayload = {
      response: JSON.stringify({
        tags: [
          { name: 'New development', category: 'NATURE' },
          { name: 'Small-scale', category: 'SCALE' },
          { name: 'Easy', category: 'DIFFICULTY' },
          { name: 'Concept stage', category: 'PHASE' },
          { name: 'Low risk', category: 'RISK' },
          { name: 'Web development', category: 'DOMAIN' },
        ],
      }),
    }

    it('returns Tag array for a valid idea with no chunks', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(validTagsPayload))

      const tags = await service.generateTags('Build a CLI tool', [])

      expect(tags).toHaveLength(6)
      expect(tags[0].name).toBe('New development')
      expect(tags[0].category.value).toBe(TagCategory.nature().value)
      expect(tags[5].category.value).toBe(TagCategory.domain().value)
    })

    it('includes chunk content in the prompt when chunks are provided', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(validTagsPayload))

      const chunks = [makeChunk('First note'), makeChunk('Second note')]
      await service.generateTags('Build a CLI tool', chunks)

      const calledBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
      expect(calledBody.prompt).toContain('First note')
      expect(calledBody.prompt).toContain('Second note')
    })

    it('does not include chunk section when chunks are empty', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(validTagsPayload))

      await service.generateTags('Build a CLI tool', [])

      const calledBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
      expect(calledBody.prompt).not.toContain('Additional notes:')
    })

    it('sends request with correct model and json format', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(validTagsPayload))

      await service.generateTags('test idea', [])

      const calledBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
      expect(calledBody.model).toBe('llama3.2')
      expect(calledBody.format).toBe('json')
      expect(calledBody.stream).toBe(false)
    })

    it('throws LLMServiceError when Ollama returns non-ok status', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse({}, false, 500))

      await expect(service.generateTags('test idea', [])).rejects.toThrow(
        LLMServiceError
      )
    })

    it('throws LLMServiceError when response JSON is invalid', async () => {
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse({ response: 'not valid json at all' })
      )

      await expect(service.generateTags('test idea', [])).rejects.toThrow(
        LLMServiceError
      )
    })

    it('throws LLMServiceError when response lacks tags field', async () => {
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse({ response: JSON.stringify({ other: 'field' }) })
      )

      // tags would be undefined.map → TypeError wrapped in LLMServiceError
      await expect(service.generateTags('test idea', [])).rejects.toThrow(
        LLMServiceError
      )
    })

    it('re-throws LLMServiceError from callOllama without wrapping again', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse({}, false, 503))

      const error = await service.generateTags('test idea', []).catch((e) => e)
      expect(error).toBeInstanceOf(LLMServiceError)
      expect(error.message).toContain('503')
    })

    it('throws LLMServiceError on network failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      await expect(service.generateTags('test idea', [])).rejects.toThrow(
        LLMServiceError
      )
    })

    it('throws LLMServiceError with timeout message when request times out', async () => {
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            const err = new DOMException('Aborted', 'AbortError')
            reject(err)
          })
      )

      const error = await service.generateTags('test idea', []).catch((e) => e)
      expect(error).toBeInstanceOf(LLMServiceError)
      expect(error.message).toContain('timed out')
    })
  })

  // ---------------------------------------------------------------------------
  // generateSuggestion
  // ---------------------------------------------------------------------------

  describe('generateSuggestion', () => {
    const validSuggestionPayload = {
      response: JSON.stringify({
        suggestion: {
          content: 'Start with a small prototype.',
          reasoning: 'A prototype helps validate assumptions early.',
        },
      }),
    }

    it('returns Suggestion for a valid idea with tags and no chunks', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(validSuggestionPayload))

      const { Tag } = await import('../../domain/index.js')
      const tags = [Tag.create('Web development', TagCategory.domain())]

      const suggestion = await service.generateSuggestion('Build a CLI tool', [], tags)

      expect(suggestion.content).toBe('Start with a small prototype.')
      expect(suggestion.reasoning).toBe('A prototype helps validate assumptions early.')
    })

    it('includes chunk content in the prompt when chunks are provided', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(validSuggestionPayload))

      const { Tag } = await import('../../domain/index.js')
      const chunks = [makeChunk('A design note')]
      const tags = [Tag.create('Infrastructure', TagCategory.domain())]

      await service.generateSuggestion('Build a CLI tool', chunks, tags)

      const calledBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
      expect(calledBody.prompt).toContain('A design note')
    })

    it('includes tag names and categories in the prompt', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResponse(validSuggestionPayload))

      const { Tag } = await import('../../domain/index.js')
      const tags = [
        Tag.create('Easy', TagCategory.difficulty()),
        Tag.create('Web development', TagCategory.domain()),
      ]

      await service.generateSuggestion('test idea', [], tags)

      const calledBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
      expect(calledBody.prompt).toContain('Easy')
      expect(calledBody.prompt).toContain('Web development')
    })

    it('throws LLMServiceError when Ollama returns non-ok status', async () => {
      const { Tag } = await import('../../domain/index.js')
      fetchMock.mockResolvedValueOnce(mockFetchResponse({}, false, 500))

      await expect(
        service.generateSuggestion('test idea', [], [Tag.create('Easy', TagCategory.difficulty())])
      ).rejects.toThrow(LLMServiceError)
    })

    it('throws LLMServiceError when response JSON is invalid', async () => {
      const { Tag } = await import('../../domain/index.js')
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse({ response: '{{bad json' })
      )

      await expect(
        service.generateSuggestion('test idea', [], [Tag.create('Easy', TagCategory.difficulty())])
      ).rejects.toThrow(LLMServiceError)
    })

    it('throws LLMServiceError with timeout message when request times out', async () => {
      const { Tag } = await import('../../domain/index.js')
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
      )

      const error = await service
        .generateSuggestion('test idea', [], [Tag.create('Easy', TagCategory.difficulty())])
        .catch((e) => e)

      expect(error).toBeInstanceOf(LLMServiceError)
      expect(error.message).toContain('timed out')
    })
  })

  // ---------------------------------------------------------------------------
  // checkConnection
  // ---------------------------------------------------------------------------

  describe('checkConnection', () => {
    it('returns true when Ollama API responds with ok status', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true } as Response)

      const result = await service.checkConnection()

      expect(result).toBe(true)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    })

    it('returns false when Ollama API responds with non-ok status', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false } as Response)

      const result = await service.checkConnection()

      expect(result).toBe(false)
    })

    it('returns false when fetch throws (network error)', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Connection refused'))

      const result = await service.checkConnection()

      expect(result).toBe(false)
    })

    it('returns false when request times out (AbortError)', async () => {
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            reject(new DOMException('Aborted', 'AbortError'))
          )
      )

      const result = await service.checkConnection()

      expect(result).toBe(false)
    })
  })
})
