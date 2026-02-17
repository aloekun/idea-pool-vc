import type { IIdeaRepository } from '../../domain/interfaces/index.js'
import { IdeaId, NotFoundError, ValidationError, DatabaseError } from '../../domain/index.js'
import type { DomainError, Chunk } from '../../domain/index.js'
import { type Result, success, failure } from '../../shared/result.js'

export class AppendChunkUseCase {
  constructor(private readonly repository: IIdeaRepository) {}

  async execute(ideaId: IdeaId, content: string): Promise<Result<Chunk, DomainError>> {
    try {
      const idea = await this.repository.findById(ideaId)
      if (!idea) {
        return failure(new NotFoundError('Idea not found', ideaId.value))
      }

      const updated = idea.addChunk(content)
      await this.repository.update(updated)

      const newChunk = updated.chunks[updated.chunks.length - 1]
      return success(newChunk)
    } catch (error) {
      if (error instanceof ValidationError) {
        return failure(error)
      }
      if (error instanceof DatabaseError) {
        return failure(error)
      }
      return failure(new DatabaseError('Failed to append chunk'))
    }
  }
}
