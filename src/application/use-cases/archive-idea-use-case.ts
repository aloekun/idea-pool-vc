import type { IIdeaRepository } from '../../domain/index.js'
import { NotFoundError, DatabaseError } from '../../domain/index.js'
import type { IdeaId } from '../../domain/index.js'
import type { DomainError } from '../../domain/index.js'
import type { Result } from '../../shared/index.js'
import { success, failure } from '../../shared/index.js'

export class ArchiveIdeaUseCase {
  constructor(private readonly repository: IIdeaRepository) {}

  async execute(ideaId: IdeaId): Promise<Result<void, DomainError>> {
    try {
      const idea = await this.repository.findById(ideaId)
      if (!idea) {
        return failure(new NotFoundError('Idea not found', ideaId.value))
      }

      const archivedIdea = idea.archive()
      if (archivedIdea !== idea) {
        await this.repository.update(archivedIdea)
      }
      return success(undefined)
    } catch (error) {
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      return failure(new DatabaseError('Failed to archive idea'))
    }
  }
}
