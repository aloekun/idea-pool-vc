import type { IIdeaRepository } from '../../domain/index.js'
import { NotFoundError, DatabaseError } from '../../domain/index.js'
import type { IdeaId, Tag } from '../../domain/index.js'
import type { DomainError } from '../../domain/index.js'
import type { Result } from '../../shared/index.js'
import { success, failure } from '../../shared/index.js'

export class AddTagUseCase {
  constructor(private readonly repository: IIdeaRepository) {}

  async execute(ideaId: IdeaId, tag: Tag): Promise<Result<void, DomainError>> {
    try {
      const idea = await this.repository.findById(ideaId)
      if (!idea) {
        return failure(new NotFoundError('Idea not found', ideaId.value))
      }

      const updatedIdea = idea.addTag(tag)
      if (updatedIdea !== idea) {
        await this.repository.update(updatedIdea)
      }
      return success(undefined)
    } catch (error) {
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      return failure(new DatabaseError('Failed to add tag'))
    }
  }
}
