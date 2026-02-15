import type { IdeaId } from '../value-objects/index.js'
import type { Idea } from '../entities/index.js'

export interface ListIdeasOptions {
  readonly limit?: number
  readonly tags?: readonly string[]
  readonly includeArchived?: boolean
  readonly archivedOnly?: boolean
}

export interface IIdeaRepository {
  save(idea: Idea): Promise<void>
  findById(id: IdeaId): Promise<Idea | null>
  findAll(options?: ListIdeasOptions): Promise<readonly Idea[]>
  findAllActive(options?: ListIdeasOptions): Promise<readonly Idea[]>
  findAllArchived(options?: ListIdeasOptions): Promise<readonly Idea[]>
  findByTags(tags: readonly string[], options?: ListIdeasOptions): Promise<readonly Idea[]>
  update(idea: Idea): Promise<void>
}
