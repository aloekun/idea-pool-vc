// DTOs
export type {
  APIResponse,
  APIError,
  ErrorCode,
  TagDTO,
  ChunkDTO,
  SuggestionDTO,
  AnalysisDTO,
  IdeaSummary,
  IdeaDetail,
} from './dto/index.js'

export {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
  toTagDTO,
  toChunkDTO,
  toSuggestionDTO,
  toAnalysisDTO,
  toIdeaSummary,
  toIdeaDetail,
} from './dto/index.js'

// Requests
export {
  AddIdeaRequest,
  AppendChunkRequest,
  AddTagRequest,
  RemoveTagRequest,
  ArchiveIdeaRequest,
  RestoreIdeaRequest,
} from './requests/index.js'

// Responses
export type {
  AddIdeaResponse,
  AppendChunkResponse,
  AddTagResponse,
  RemoveTagResponse,
  ArchiveIdeaResponse,
  RestoreIdeaResponse,
} from './responses/index.js'

// Use Cases
export {
  AddIdeaUseCase,
  AppendChunkUseCase,
  AddTagUseCase,
  RemoveTagUseCase,
  ArchiveIdeaUseCase,
  RestoreIdeaUseCase,
} from './use-cases/index.js'

// API
export { IdeaCommandAPI } from './api/index.js'
export { convertDomainErrorToAPIError } from './api/index.js'
