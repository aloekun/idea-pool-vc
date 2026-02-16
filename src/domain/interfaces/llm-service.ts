import type { Tag } from '../entities/tag.js'
import type { Chunk } from '../entities/chunk.js'
import type { Suggestion } from '../entities/suggestion.js'

export interface ILLMService {
  generateTags(
    ideaContent: string,
    chunks: readonly Chunk[]
  ): Promise<readonly Tag[]>

  generateSuggestion(
    ideaContent: string,
    chunks: readonly Chunk[],
    tags: readonly Tag[]
  ): Promise<Suggestion>

  checkConnection(): Promise<boolean>
}
