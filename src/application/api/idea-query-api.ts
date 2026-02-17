import type { APIResponse } from '../dto/index.js'
import { createSuccessResponse, createErrorResponse, ERROR_CODES } from '../dto/index.js'
import type { IdeaDetail } from '../dto/index.js'
import type { ListIdeasResponse } from '../responses/index.js'
import type { ListIdeasUseCase } from '../usecases/list-ideas-use-case.js'
import type { ShowIdeaUseCase } from '../usecases/show-idea-use-case.js'
import type { ArchiveFilter } from '../../domain/index.js'
import { IdeaId } from '../../domain/index.js'
import { convertDomainErrorToAPIError } from './error-converter.js'

export class IdeaQueryAPI {
  constructor(
    private readonly listIdeasUseCase: ListIdeasUseCase,
    private readonly showIdeaUseCase: ShowIdeaUseCase
  ) {}

  async listIdeas(request: {
    limit?: number
    tags: readonly string[]
    archiveFilter?: ArchiveFilter
    includeArchived?: boolean
    archivedOnly?: boolean
  }): Promise<APIResponse<ListIdeasResponse>> {
    try {
      const includeArchived =
        request.archiveFilter === 'all' || (request.includeArchived ?? false)
      const archivedOnly =
        request.archiveFilter === 'archived' || (request.archivedOnly ?? false)

      const result = await this.listIdeasUseCase.execute({
        limit: request.limit,
        tags: [...request.tags],
        includeArchived,
        archivedOnly,
      })

      if (result.isFailure) {
        return convertDomainErrorToAPIError(result.error)
      }

      const ideas = result.value
      return createSuccessResponse<ListIdeasResponse>({
        ideas: [...ideas],
        total: ideas.length,
      })
    } catch (error) {
      return createErrorResponse({
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    }
  }

  async showIdea(request: { ideaId: string }): Promise<APIResponse<IdeaDetail>> {
    try {
      const ideaId = IdeaId.fromString(request.ideaId)
      const result = await this.showIdeaUseCase.execute(ideaId)

      if (result.isFailure) {
        return convertDomainErrorToAPIError(result.error)
      }

      return createSuccessResponse<IdeaDetail>(result.value)
    } catch (error) {
      return createErrorResponse({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error instanceof Error ? error.message : 'Invalid idea ID',
      })
    }
  }
}
