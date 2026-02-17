import type { TagDTO, SuggestionDTO, IdeaSummary, IdeaDetail } from '../dto/index.js'

export interface AddIdeaResponse {
  readonly ideaId: string
  readonly content: string
  readonly createdAt: string
}

export interface AppendChunkResponse {
  readonly ideaId: string
  readonly chunkId: string
  readonly content: string
  readonly createdAt: string
}

export interface ListIdeasResponse {
  readonly ideas: readonly IdeaSummary[]
  readonly total: number
}

export interface ShowIdeaResponse {
  readonly idea: IdeaDetail
}

export interface AnalyzeIdeaResponse {
  readonly analysisId: string
  readonly generatedTags: readonly TagDTO[]
  readonly createdAt: string
}

export interface SuggestActionResponse {
  readonly analysisId: string
  readonly usedAnalysisId: string
  readonly suggestion: SuggestionDTO
  readonly createdAt: string
}

export interface AddTagResponse {
  readonly ideaId: string
  readonly tag: TagDTO
}

export interface RemoveTagResponse {
  readonly ideaId: string
  readonly removedTagName: string
}

export interface ArchiveIdeaResponse {
  readonly ideaId: string
  readonly archivedAt: string
}

export interface RestoreIdeaResponse {
  readonly ideaId: string
}
