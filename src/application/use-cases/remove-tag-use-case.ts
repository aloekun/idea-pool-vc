import type { IIdeaRepository } from '../../domain/interfaces/index.js'
import { NotFoundError, DatabaseError } from '../../domain/index.js'
import type { IdeaId, DomainError } from '../../domain/index.js'
import { type Result, success, failure } from '../../shared/result.js'

export class RemoveTagUseCase {
  constructor(private readonly repository: IIdeaRepository) {}

  async execute(ideaId: IdeaId, tagName: string): Promise<Result<void, DomainError>> {
    try {
      const idea = await this.repository.findById(ideaId)
      if (!idea) {
        return failure(new NotFoundError('Idea not found', ideaId.value))
      }

      const existingTag = idea.tags.find((t) => t.name === tagName)
      if (!existingTag) {
        return success(undefined)
      }

      const updated = idea.removeTag(existingTag)
      await this.repository.update(updated)

      return success(undefined)
    } catch (error) {
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      return failure(new DatabaseError('Failed to remove tag'))
    }
  }
}
