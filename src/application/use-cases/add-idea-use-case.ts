import type { IIdeaRepository } from '../../domain/interfaces/index.js'
import { Idea, IdeaId, ValidationError, DatabaseError } from '../../domain/index.js'
import type { DomainError } from '../../domain/index.js'
import { type Result, success, failure } from '../../shared/result.js'

export class AddIdeaUseCase {
  constructor(private readonly repository: IIdeaRepository) {}

  async execute(content: string): Promise<Result<IdeaId, DomainError>> {
    try {
      const idea = Idea.create(content)
      await this.repository.save(idea)
      return success(idea.id)
    } catch (error) {
      if (error instanceof ValidationError) {
        return failure(error)
      }
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      return failure(new DatabaseError('Failed to save idea'))
    }
  }
}
