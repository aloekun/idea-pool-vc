import type { ListIdeasUseCase } from '../usecases/list-ideas-use-case.js'
import type { ShowIdeaUseCase } from '../usecases/show-idea-use-case.js'
import type { ListIdeasRequest } from '../query/list-ideas-request.js'
import type { ShowIdeaRequest } from '../query/show-idea-request.js'
import type { ListIdeasResponse } from '../query/list-ideas-response.js'
import type { ShowIdeaResponse } from '../query/show-idea-response.js'
import type { APIResponse } from '../dto/api-response.js'
import { IdeaId, NotFoundError, ValidationError, DatabaseError } from '../../domain/index.js'
import type { DomainError } from '../../domain/index.js'

export class IdeaQueryAPI {
  constructor(
    private readonly listIdeasUseCase: ListIdeasUseCase,
    private readonly showIdeaUseCase: ShowIdeaUseCase
  ) {}

  async listIdeas(
    request: ListIdeasRequest
  ): Promise<APIResponse<ListIdeasResponse>> {
    const result = await this.listIdeasUseCase.execute({
      limit: request.limit,
      tags: request.tags.length > 0 ? request.tags : undefined,
      includeArchived: request.archiveFilter === 'all',
      archivedOnly: request.archiveFilter === 'archived',
    })

    if (result.isSuccess) {
      const ideas = result.value
      return {
        success: true,
        data: {
          ideas,
          total: ideas.length,
        },
      }
    }

    return this.convertError(result.error)
  }

  async showIdea(
    request: ShowIdeaRequest
  ): Promise<APIResponse<ShowIdeaResponse>> {
    const ideaId = IdeaId.fromString(request.ideaId)
    const result = await this.showIdeaUseCase.execute(ideaId)

    if (result.isSuccess) {
      return {
        success: true,
        data: result.value,
      }
    }

    return this.convertError(result.error)
  }

  private convertError<T>(error: DomainError): APIResponse<T> {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      }
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
          details: { resourceId: error.resourceId },
        },
      }
    }

    if (error instanceof DatabaseError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
        },
      }
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }
  }
}
