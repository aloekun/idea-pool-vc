import type { IIdeaRepository } from '../../domain/interfaces/index.js'
import type { ILLMService } from '../../domain/interfaces/index.js'
import type { IdeaId, AnalysisId } from '../../domain/index.js'
import type { Suggestion } from '../../domain/index.js'
import { Analysis, NotFoundError, DomainError } from '../../domain/index.js'
import type { Result } from '../../shared/index.js'
import { success, failure, handleUseCaseError } from '../../shared/index.js'

export interface SuggestActionResult {
  readonly newAnalysisId: AnalysisId
  readonly usedAnalysisId: AnalysisId
  readonly suggestion: Suggestion
  readonly createdAt: Date
}

export class SuggestActionUseCase {
  constructor(
    private readonly repository: IIdeaRepository,
    private readonly llmService: ILLMService
  ) {}

  async execute(
    ideaId: IdeaId,
    analysisId?: AnalysisId
  ): Promise<Result<SuggestActionResult, DomainError>> {
    try {
      const idea = await this.repository.findById(ideaId)
      if (!idea) {
        return failure(
          new NotFoundError('Idea not found', ideaId.value)
        )
      }

      const targetAnalysis = analysisId
        ? idea.analyses.find((a) => a.id.equals(analysisId))
        : idea.analyses.length > 0
          ? idea.analyses[idea.analyses.length - 1]
          : undefined

      if (!targetAnalysis) {
        const message = analysisId
          ? 'Analysis not found'
          : 'No analysis exists for this idea'
        return failure(
          new NotFoundError(message, analysisId?.value ?? ideaId.value)
        )
      }

      const suggestion = await this.llmService.generateSuggestion(
        idea.content,
        idea.chunks,
        [...targetAnalysis.generatedTags]
      )

      const newAnalysis = Analysis.createWithSuggestion(
        suggestion,
        targetAnalysis.generatedTags
      )

      const updatedIdea = idea.addAnalysis(newAnalysis)
      await this.repository.update(updatedIdea)

      return success({
        newAnalysisId: newAnalysis.id,
        usedAnalysisId: targetAnalysis.id,
        suggestion,
        createdAt: newAnalysis.createdAt,
      })
    } catch (error) {
      return handleUseCaseError(error)
    }
  }
}
