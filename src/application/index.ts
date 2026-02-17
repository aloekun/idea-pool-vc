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

// Use Cases
export {
  AddIdeaUseCase,
  AppendChunkUseCase,
  ListIdeasUseCase,
  ShowIdeaUseCase,
  AnalyzeIdeaUseCase,
  SuggestActionUseCase,
  AddTagUseCase,
  RemoveTagUseCase,
  ArchiveIdeaUseCase,
  RestoreIdeaUseCase,
} from './use-cases/index.js'
export type { ListIdeasParams, SuggestActionResult } from './use-cases/index.js'

// Requests
export {
  AddIdeaRequest,
  AppendChunkRequest,
  ListIdeasRequest,
  ShowIdeaRequest,
  AnalyzeIdeaRequest,
  SuggestActionRequest,
  AddTagRequest,
  RemoveTagRequest,
  ArchiveIdeaRequest,
  RestoreIdeaRequest,
} from './requests/index.js'

// Responses
export type {
  AddIdeaResponse,
  AppendChunkResponse,
  ListIdeasResponse,
  ShowIdeaResponse,
  AnalyzeIdeaResponse,
  SuggestActionResponse,
  AddTagResponse,
  RemoveTagResponse,
  ArchiveIdeaResponse,
  RestoreIdeaResponse,
} from './responses/index.js'

// API Facades
export { IdeaCommandAPI, IdeaQueryAPI, IdeaAnalysisAPI } from './api/index.js'
export { convertDomainErrorToAPIError } from './api/index.js'
