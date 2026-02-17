import type { AnalyzeIdeaUseCase } from '../use-cases/analyze-idea-use-case.js'
import type { SuggestActionUseCase } from '../use-cases/suggest-action-use-case.js'
import type { AnalyzeIdeaRequest } from '../requests/analyze-idea-request.js'
import type { SuggestActionRequest } from '../requests/suggest-action-request.js'
import type { AnalyzeIdeaResponse } from '../responses/analyze-idea-response.js'
import type { SuggestActionResponse } from '../responses/suggest-action-response.js'
import type { APIResponse } from '../dto/api-response.js'
import { createSuccessResponse, createErrorResponse } from '../dto/api-response.js'
import { toTagDTO, toSuggestionDTO } from '../dto/idea-dto.js'
import { IdeaId, AnalysisId } from '../../domain/index.js'
import {
  DomainError,
  ValidationError,
  NotFoundError,
  LLMServiceError,
  DatabaseError,
  UnexpectedError,
} from '../../domain/index.js'

export class IdeaAnalysisAPI {
  constructor(
    private readonly analyzeIdeaUseCase: AnalyzeIdeaUseCase,
    private readonly suggestActionUseCase: SuggestActionUseCase
  ) {}

  async analyzeIdea(
    request: AnalyzeIdeaRequest
  ): Promise<APIResponse<AnalyzeIdeaResponse>> {
    try {
      const ideaId = IdeaId.fromString(request.ideaId)
      const result = await this.analyzeIdeaUseCase.execute(ideaId)

      if (result.isSuccess) {
        const analysis = result.value
        return createSuccessResponse<AnalyzeIdeaResponse>({
          analysisId: analysis.id.value,
          generatedTags: analysis.generatedTags.map(toTagDTO),
          createdAt: analysis.createdAt.toISOString(),
        })
      }

      return this.convertDomainErrorToAPIError(result.error)
    } catch (error) {
      return this.handleUnexpectedError(error)
    }
  }

  async suggestAction(
    request: SuggestActionRequest
  ): Promise<APIResponse<SuggestActionResponse>> {
    try {
      const ideaId = IdeaId.fromString(request.ideaId)
      const analysisId = request.analysisId
        ? AnalysisId.fromString(request.analysisId)
        : undefined

      const result = await this.suggestActionUseCase.execute(ideaId, analysisId)

      if (result.isSuccess) {
        const data = result.value
        return createSuccessResponse<SuggestActionResponse>({
          analysisId: data.newAnalysisId.value,
          usedAnalysisId: data.usedAnalysisId.value,
          suggestion: toSuggestionDTO(data.suggestion),
          createdAt: data.createdAt.toISOString(),
        })
      }

      return this.convertDomainErrorToAPIError(result.error)
    } catch (error) {
      return this.handleUnexpectedError(error)
    }
  }

  private convertDomainErrorToAPIError<T>(
    error: DomainError
  ): APIResponse<T> {
    if (error instanceof ValidationError) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: error.message,
      })
    }

    if (error instanceof NotFoundError) {
      return createErrorResponse({
        code: 'NOT_FOUND',
        message: error.message,
        details: { resourceId: error.resourceId },
      })
    }

    if (error instanceof LLMServiceError) {
      return createErrorResponse({
        code: 'LLM_SERVICE_ERROR',
        message: 'LLM service communication failed. Please try again later.',
      })
    }

    if (error instanceof DatabaseError) {
      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Database operation failed.',
      })
    }

    if (error instanceof UnexpectedError) {
      return createErrorResponse({
        code: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred.',
      })
    }

    return createErrorResponse({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    })
  }

  private handleUnexpectedError<T>(error: unknown): APIResponse<T> {
    if (error instanceof DomainError) {
      return this.convertDomainErrorToAPIError(error)
    }

    return createErrorResponse({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    })
  }
}
