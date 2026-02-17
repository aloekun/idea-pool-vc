import type { APIResponse } from '../dto/index.js'
import { createSuccessResponse, createErrorResponse, ERROR_CODES, toIdeaSummary, toIdeaDetail } from '../dto/index.js'
import type { ListIdeasResponse, ShowIdeaResponse } from '../responses/index.js'
import type { ListIdeasRequest } from '../requests/list-ideas-request.js'
import type { ShowIdeaRequest } from '../requests/show-idea-request.js'
import type { ListIdeasUseCase } from '../use-cases/list-ideas-use-case.js'
import type { ShowIdeaUseCase } from '../use-cases/show-idea-use-case.js'
import { IdeaId } from '../../domain/index.js'
import { convertDomainErrorToAPIError } from './error-converter.js'

export class IdeaQueryAPI {
  constructor(
    private readonly listIdeasUseCase: ListIdeasUseCase,
    private readonly showIdeaUseCase: ShowIdeaUseCase
  ) {}

  async listIdeas(request: ListIdeasRequest): Promise<APIResponse<ListIdeasResponse>> {
    try {
      const result = await this.listIdeasUseCase.execute({
        limit: request.limit,
        tags: [...request.tags],
        includeArchived: request.includeArchived,
        archivedOnly: request.archivedOnly,
      })

      if (result.isFailure) {
        return convertDomainErrorToAPIError(result.error)
      }

      const ideas = result.value
      return createSuccessResponse<ListIdeasResponse>({
        ideas: ideas.map(toIdeaSummary),
        total: ideas.length,
      })
    } catch (error) {
      return createErrorResponse({
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    }
  }

  async showIdea(request: ShowIdeaRequest): Promise<APIResponse<ShowIdeaResponse>> {
    try {
      const ideaId = IdeaId.fromString(request.ideaId)
      const result = await this.showIdeaUseCase.execute(ideaId)

      if (result.isFailure) {
        return convertDomainErrorToAPIError(result.error)
      }

      return createSuccessResponse<ShowIdeaResponse>({
        idea: toIdeaDetail(result.value),
      })
    } catch (error) {
      return createErrorResponse({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error instanceof Error ? error.message : 'Invalid idea ID',
      })
    }
  }
}
