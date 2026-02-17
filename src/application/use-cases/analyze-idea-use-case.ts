import type { IIdeaRepository } from '../../domain/interfaces/index.js'
import type { ILLMService } from '../../domain/interfaces/index.js'
import type { IdeaId } from '../../domain/index.js'
import {
  Analysis,
  NotFoundError,
  LLMServiceError,
  DatabaseError,
  DomainError,
} from '../../domain/index.js'
import type { Result } from '../../shared/index.js'
import { success, failure } from '../../shared/index.js'

export class AnalyzeIdeaUseCase {
  constructor(
    private readonly repository: IIdeaRepository,
    private readonly llmService: ILLMService
  ) {}

  async execute(ideaId: IdeaId): Promise<Result<Analysis, DomainError>> {
    try {
      const idea = await this.repository.findById(ideaId)
      if (!idea) {
        return failure(
          new NotFoundError('Idea not found', ideaId.value)
        )
      }

      const generatedTags = await this.llmService.generateTags(
        idea.content,
        idea.chunks
      )

      const analysis = Analysis.createWithTags(generatedTags)

      const updatedIdea = idea.addAnalysis(analysis)
      await this.repository.update(updatedIdea)

      return success(analysis)
    } catch (error) {
      if (error instanceof LLMServiceError) {
        return failure(error)
      }
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      if (error instanceof DomainError) {
        return failure(error)
      }
      return failure(
        new DatabaseError(
          error instanceof Error ? error.message : 'Unexpected error occurred'
        )
      )
    }
  }
}
