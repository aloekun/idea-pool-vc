import type { IIdeaRepository } from '../../domain/index.js'
import { Idea, ValidationError, DatabaseError } from '../../domain/index.js'
import type { IdeaId } from '../../domain/index.js'
import type { DomainError } from '../../domain/index.js'
import type { Result } from '../../shared/index.js'
import { success, failure } from '../../shared/index.js'

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
      if (error instanceof Error && error.message.includes('cannot be empty')) {
        return failure(new ValidationError(error.message))
      }
      return failure(new DatabaseError('Failed to save idea'))
    }
  }
}
