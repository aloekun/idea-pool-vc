// Value Objects
export {
  IdeaId,
  ChunkId,
  AnalysisId,
  TagCategory,
  TAG_CATEGORIES,
} from './value-objects/index.js'
export type { TagCategoryType } from './value-objects/index.js'

// Entities
export { Tag, Chunk, Suggestion, Analysis, Idea } from './entities/index.js'
export type {
  TagProps,
  ChunkProps,
  SuggestionProps,
  AnalysisProps,
  IdeaProps,
} from './entities/index.js'

// Errors
export {
  DomainError,
  ValidationError,
  NotFoundError,
  LLMServiceError,
  DatabaseError,
} from './errors/index.js'

// Interfaces
export type { IIdeaRepository, ListIdeasOptions } from './interfaces/index.js'
export type { ILLMService } from './interfaces/index.js'
