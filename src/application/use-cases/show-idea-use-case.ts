import type { IIdeaRepository } from '../../domain/interfaces/index.js'
import { IdeaId, NotFoundError, DatabaseError } from '../../domain/index.js'
import type { Idea, DomainError } from '../../domain/index.js'
import { type Result, success, failure } from '../../shared/result.js'

export class ShowIdeaUseCase {
  constructor(private readonly repository: IIdeaRepository) {}

  async execute(ideaId: IdeaId): Promise<Result<Idea, DomainError>> {
    try {
      const idea = await this.repository.findById(ideaId)
      if (!idea) {
        return failure(new NotFoundError('Idea not found', ideaId.value))
      }
      return success(idea)
    } catch (error) {
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      return failure(new DatabaseError('Failed to show idea'))
    }
  }
}
