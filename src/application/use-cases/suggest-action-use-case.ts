import type { IIdeaRepository } from '../../domain/interfaces/index.js'
import type { ILLMService } from '../../domain/interfaces/index.js'
import { NotFoundError, LLMServiceError, DatabaseError, Analysis } from '../../domain/index.js'
import type { IdeaId, AnalysisId, DomainError, Suggestion } from '../../domain/index.js'
import { type Result, success, failure } from '../../shared/result.js'

export interface SuggestActionResult {
  readonly analysisId: string
  readonly usedAnalysisId: string
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
        return failure(new NotFoundError('Idea not found', ideaId.value))
      }

      if (idea.analyses.length === 0) {
        return failure(new NotFoundError('No analysis found for this idea', ideaId.value))
      }

      const usedAnalysis = analysisId
        ? idea.analyses.find((a) => a.id.equals(analysisId))
        : idea.analyses[idea.analyses.length - 1]

      if (!usedAnalysis) {
        return failure(new NotFoundError('Analysis not found', analysisId?.value ?? ideaId.value))
      }

      const suggestion = await this.llmService.generateSuggestion(
        idea.content,
        idea.chunks,
        usedAnalysis.generatedTags
      )

      const newAnalysis = Analysis.createWithSuggestion(suggestion, usedAnalysis.generatedTags)
      const updated = idea.addAnalysis(newAnalysis)
      await this.repository.update(updated)

      return success({
        analysisId: newAnalysis.id.value,
        usedAnalysisId: usedAnalysis.id.value,
        suggestion,
        createdAt: newAnalysis.createdAt,
      })
    } catch (error) {
      if (error instanceof LLMServiceError) {
        return failure(error)
      }
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      return failure(new DatabaseError('Failed to suggest action'))
    }
  }
}
