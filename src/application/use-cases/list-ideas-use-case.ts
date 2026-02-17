import type { IIdeaRepository, ListIdeasOptions } from '../../domain/interfaces/index.js'
import type { Idea, DomainError } from '../../domain/index.js'
import { DatabaseError } from '../../domain/index.js'
import { type Result, success, failure } from '../../shared/result.js'

export interface ListIdeasParams {
  readonly limit?: number
  readonly tags?: readonly string[]
  readonly includeArchived?: boolean
  readonly archivedOnly?: boolean
}

export class ListIdeasUseCase {
  constructor(private readonly repository: IIdeaRepository) {}

  async execute(params?: ListIdeasParams): Promise<Result<readonly Idea[], DomainError>> {
    try {
      const archiveFilter = params?.archivedOnly
        ? 'archived' as const
        : params?.includeArchived
          ? 'all' as const
          : 'active' as const

      const options: ListIdeasOptions = {
        limit: params?.limit,
        archiveFilter,
      }

      let ideas: readonly Idea[]
      if (params?.tags && params.tags.length > 0) {
        ideas = await this.repository.findByTags(params.tags, options)
      } else {
        ideas = await this.repository.findAll(options)
      }

      return success(ideas)
    } catch (error) {
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      return failure(new DatabaseError('Failed to list ideas'))
    }
  }
}
