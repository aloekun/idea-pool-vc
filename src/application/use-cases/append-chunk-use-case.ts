import type { IIdeaRepository } from '../../domain/index.js'
import { NotFoundError, ValidationError, DatabaseError } from '../../domain/index.js'
import type { IdeaId } from '../../domain/index.js'
import type { Chunk } from '../../domain/index.js'
import type { DomainError } from '../../domain/index.js'
import type { Result } from '../../shared/index.js'
import { success, failure } from '../../shared/index.js'

export class AppendChunkUseCase {
  constructor(private readonly repository: IIdeaRepository) {}

  async execute(ideaId: IdeaId, content: string): Promise<Result<Chunk, DomainError>> {
    try {
      const idea = await this.repository.findById(ideaId)
      if (!idea) {
        return failure(new NotFoundError('Idea not found', ideaId.value))
      }

      const updatedIdea = idea.addChunk(content)
      await this.repository.update(updatedIdea)

      const newChunk = updatedIdea.chunks[updatedIdea.chunks.length - 1]
      return success(newChunk)
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
      return failure(new DatabaseError('Failed to append chunk'))
    }
  }
}
