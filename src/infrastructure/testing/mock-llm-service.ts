import type { ILLMService } from '../../domain/interfaces/index.js'
import { Tag, Suggestion, TagCategory, LLMServiceError } from '../../domain/index.js'
import type { Chunk } from '../../domain/index.js'

export interface MockLLMServiceOptions {
  shouldFail?: boolean
  failMessage?: string
  customTags?: readonly Tag[]
  customSuggestion?: Suggestion
}

export class MockLLMService implements ILLMService {
  private options: MockLLMServiceOptions
  private callCount = 0
  private lastGenerateTagsArgs: { ideaContent: string; chunks: readonly Chunk[] } | null = null
  private lastGenerateSuggestionArgs: {
    ideaContent: string
    chunks: readonly Chunk[]
    tags: readonly Tag[]
  } | null = null

  constructor(options: MockLLMServiceOptions = {}) {
    this.options = options
  }

  async generateTags(
    ideaContent: string,
    chunks: readonly Chunk[]
  ): Promise<readonly Tag[]> {
    this.callCount++
    this.lastGenerateTagsArgs = { ideaContent, chunks }

    if (this.options.shouldFail) {
      throw new LLMServiceError(
        this.options.failMessage ?? 'Mock LLM service error'
      )
    }

    if (this.options.customTags) {
      return this.options.customTags
    }

    return [
      Tag.create('Web', TagCategory.domain()),
      Tag.create('Medium', TagCategory.scale()),
      Tag.create('Normal', TagCategory.difficulty()),
      Tag.create('Concept', TagCategory.phase()),
      Tag.create('Low', TagCategory.risk()),
      Tag.create('New', TagCategory.nature()),
    ]
  }

  async generateSuggestion(
    ideaContent: string,
    chunks: readonly Chunk[],
    tags: readonly Tag[]
  ): Promise<Suggestion> {
    this.callCount++
    this.lastGenerateSuggestionArgs = { ideaContent, chunks, tags }

    if (this.options.shouldFail) {
      throw new LLMServiceError(
        this.options.failMessage ?? 'Mock LLM service error'
      )
    }

    if (this.options.customSuggestion) {
      return this.options.customSuggestion
    }

    return Suggestion.create(
      'Consider starting with a proof of concept to validate the core functionality.',
      'This approach minimizes initial investment while allowing you to test assumptions.'
    )
  }

  async checkConnection(): Promise<boolean> {
    return !this.options.shouldFail
  }

  setOptions(options: MockLLMServiceOptions): void {
    this.options = options
  }

  setShouldFail(shouldFail: boolean, message?: string): void {
    this.options.shouldFail = shouldFail
    if (message) {
      this.options.failMessage = message
    }
  }

  getCallCount(): number {
    return this.callCount
  }

  getLastGenerateTagsArgs(): { ideaContent: string; chunks: readonly Chunk[] } | null {
    return this.lastGenerateTagsArgs
  }

  getLastGenerateSuggestionArgs(): {
    ideaContent: string
    chunks: readonly Chunk[]
    tags: readonly Tag[]
  } | null {
    return this.lastGenerateSuggestionArgs
  }

  reset(): void {
    this.callCount = 0
    this.lastGenerateTagsArgs = null
    this.lastGenerateSuggestionArgs = null
    this.options = {}
  }
}
