import type { IIdeaRepository, IdeaId } from '../../domain/index.js'
import { NotFoundError, DatabaseError } from '../../domain/index.js'
import type { IdeaDetail } from '../dto/index.js'
import { toIdeaDetail } from '../dto/index.js'
import { type Result, success, failure } from '../../shared/result.js'
import type { DomainError } from '../../domain/index.js'

export class ShowIdeaUseCase {
  constructor(private readonly repository: IIdeaRepository) {}

  async execute(ideaId: IdeaId): Promise<Result<IdeaDetail, DomainError>> {
    try {
      const idea = await this.repository.findById(ideaId)

      if (!idea) {
        return failure(
          new NotFoundError(
            `Idea not found: ${ideaId.value}`,
            ideaId.value
          )
        )
      }

      return success(toIdeaDetail(idea))
    } catch (error) {
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      return failure(new DatabaseError('Failed to retrieve idea'))
    }
  }
}
