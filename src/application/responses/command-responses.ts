import type { TagDTO } from '../dto/index.js'

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
