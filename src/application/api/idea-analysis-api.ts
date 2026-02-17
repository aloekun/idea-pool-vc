import type { APIResponse } from '../dto/index.js'
import { createSuccessResponse, toTagDTO, toSuggestionDTO } from '../dto/index.js'
import type { AnalyzeIdeaResponse, SuggestActionResponse } from '../responses/index.js'
import type { AnalyzeIdeaRequest } from '../requests/analyze-idea-request.js'
import type { SuggestActionRequest } from '../requests/suggest-action-request.js'
import type { AnalyzeIdeaUseCase } from '../use-cases/analyze-idea-use-case.js'
import type { SuggestActionUseCase } from '../use-cases/suggest-action-use-case.js'
import { IdeaId, AnalysisId } from '../../domain/index.js'
import { convertDomainErrorToAPIError } from './error-converter.js'

export class IdeaAnalysisAPI {
  constructor(
    private readonly analyzeIdeaUseCase: AnalyzeIdeaUseCase,
    private readonly suggestActionUseCase: SuggestActionUseCase
  ) {}

  async analyzeIdea(request: AnalyzeIdeaRequest): Promise<APIResponse<AnalyzeIdeaResponse>> {
    const ideaId = IdeaId.fromString(request.ideaId)
    const result = await this.analyzeIdeaUseCase.execute(ideaId)

    if (result.isFailure) {
      return convertDomainErrorToAPIError(result.error)
    }

    const analysis = result.value
    return createSuccessResponse<AnalyzeIdeaResponse>({
      analysisId: analysis.id.value,
      generatedTags: analysis.generatedTags.map(toTagDTO),
      createdAt: analysis.createdAt.toISOString(),
    })
  }

  async suggestAction(request: SuggestActionRequest): Promise<APIResponse<SuggestActionResponse>> {
    const ideaId = IdeaId.fromString(request.ideaId)
    const analysisId = request.analysisId
      ? AnalysisId.fromString(request.analysisId)
      : undefined

    const result = await this.suggestActionUseCase.execute(ideaId, analysisId)

    if (result.isFailure) {
      return convertDomainErrorToAPIError(result.error)
    }

    const data = result.value
    return createSuccessResponse<SuggestActionResponse>({
      analysisId: data.analysisId,
      usedAnalysisId: data.usedAnalysisId,
      suggestion: toSuggestionDTO(data.suggestion),
      createdAt: data.createdAt.toISOString(),
    })
  }
}
