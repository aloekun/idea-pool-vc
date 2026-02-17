import type { IIdeaRepository, ArchiveFilter } from '../../domain/index.js'
import { DatabaseError } from '../../domain/index.js'
import type { IdeaSummary } from '../dto/index.js'
import { toIdeaSummary } from '../dto/index.js'
import { type Result, success, failure } from '../../shared/result.js'
import type { DomainError } from '../../domain/index.js'

export interface ListIdeasUseCaseOptions {
  readonly limit?: number
  readonly tags?: readonly string[]
  readonly includeArchived?: boolean
  readonly archivedOnly?: boolean
}

const DEFAULT_LIMIT = 10

export class ListIdeasUseCase {
  constructor(private readonly repository: IIdeaRepository) {}

  async execute(
    options: ListIdeasUseCaseOptions
  ): Promise<Result<readonly IdeaSummary[], DomainError>> {
    try {
      const limit = options.limit ?? DEFAULT_LIMIT
      const archiveFilter = this.resolveArchiveFilter(options)
      const tags = options.tags ?? []

      const repoOptions = { limit, archiveFilter }

      const ideas =
        tags.length > 0
          ? await this.repository.findByTags(tags, repoOptions)
          : await this.repository.findAll(repoOptions)

      const summaries = ideas.map(toIdeaSummary)
      return success(summaries)
    } catch (error) {
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      return failure(new DatabaseError('Failed to retrieve ideas'))
    }
  }

  private resolveArchiveFilter(options: ListIdeasUseCaseOptions): ArchiveFilter {
    if (options.includeArchived) {
      return 'all'
    }
    if (options.archivedOnly) {
      return 'archived'
    }
    return 'active'
  }
}
