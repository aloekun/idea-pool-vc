import type { Idea, Analysis, Chunk, Tag } from '../../domain/index.js'

export interface TagDTO {
  name: string
  category: string
}

export interface ChunkDTO {
  id: string
  content: string
  createdAt: string
}

export interface SuggestionDTO {
  content: string
  reasoning: string
}

export interface AnalysisDTO {
  id: string
  generatedTags: TagDTO[]
  suggestion: SuggestionDTO | null
  createdAt: string
}

export interface IdeaSummary {
  id: string
  content: string
  createdAt: string
  archivedAt: string | null
  tagCount: number
  chunkCount: number
  hasAnalysis: boolean
}

export interface IdeaDetail {
  id: string
  content: string
  createdAt: string
  archivedAt: string | null
  chunks: ChunkDTO[]
  tags: TagDTO[]
  analyses: AnalysisDTO[]
}

export function toTagDTO(tag: Tag): TagDTO {
  return {
    name: tag.name,
    category: tag.category.value,
  }
}

export function toChunkDTO(chunk: Chunk): ChunkDTO {
  return {
    id: chunk.id.value,
    content: chunk.content,
    createdAt: chunk.createdAt.toISOString(),
  }
}

export function toSuggestionDTO(suggestion: { content: string; reasoning: string }): SuggestionDTO {
  return {
    content: suggestion.content,
    reasoning: suggestion.reasoning,
  }
}

export function toAnalysisDTO(analysis: Analysis): AnalysisDTO {
  return {
    id: analysis.id.value,
    generatedTags: analysis.generatedTags.map(toTagDTO),
    suggestion: analysis.suggestion ? toSuggestionDTO(analysis.suggestion) : null,
    createdAt: analysis.createdAt.toISOString(),
  }
}

export function toIdeaSummary(idea: Idea): IdeaSummary {
  const MAX_CONTENT_LENGTH = 100
  const truncatedContent =
    idea.content.length > MAX_CONTENT_LENGTH
      ? idea.content.substring(0, MAX_CONTENT_LENGTH) + '...'
      : idea.content

  return {
    id: idea.id.value,
    content: truncatedContent,
    createdAt: idea.createdAt.toISOString(),
    archivedAt: idea.archivedAt?.toISOString() ?? null,
    tagCount: idea.tags.length,
    chunkCount: idea.chunks.length,
    hasAnalysis: idea.analyses.length > 0,
  }
}

export function toIdeaDetail(idea: Idea): IdeaDetail {
  return {
    id: idea.id.value,
    content: idea.content,
    createdAt: idea.createdAt.toISOString(),
    archivedAt: idea.archivedAt?.toISOString() ?? null,
    chunks: idea.chunks.map(toChunkDTO),
    tags: idea.tags.map(toTagDTO),
    analyses: idea.analyses.map(toAnalysisDTO),
  }
}
