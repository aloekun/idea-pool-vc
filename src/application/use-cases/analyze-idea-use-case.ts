import type { IIdeaRepository } from '../../domain/interfaces/index.js'
import type { ILLMService } from '../../domain/interfaces/index.js'
import { NotFoundError, LLMServiceError, DatabaseError, ValidationError, Analysis } from '../../domain/index.js'
import type { IdeaId, DomainError } from '../../domain/index.js'
import { type Result, success, failure } from '../../shared/result.js'

export class AnalyzeIdeaUseCase {
  constructor(
    private readonly repository: IIdeaRepository,
    private readonly llmService: ILLMService
  ) {}

  async execute(ideaId: IdeaId): Promise<Result<Analysis, DomainError>> {
    try {
      const idea = await this.repository.findById(ideaId)
      if (!idea) {
        return failure(new NotFoundError('Idea not found', ideaId.value))
      }

      const tags = await this.llmService.generateTags(idea.content, idea.chunks)
      const analysis = Analysis.createWithTags(tags)
      const updated = idea.addAnalysis(analysis)
      await this.repository.update(updated)

      return success(analysis)
    } catch (error) {
      if (error instanceof ValidationError) {
        return failure(error)
      }
      if (error instanceof LLMServiceError) {
        return failure(error)
      }
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      return failure(new DatabaseError('Failed to analyze idea'))
    }
  }
}
