import { ValidationError } from '../../domain/index.js'

export class AppendChunkRequest {
  readonly ideaId: string
  readonly content: string

  constructor(ideaId: string, content: string) {
    if (!ideaId || ideaId.trim() === '') {
      throw new ValidationError('Idea ID is required')
    }
    if (!content || content.trim() === '') {
      throw new ValidationError('Chunk content is required')
    }
    this.ideaId = ideaId.trim()
    this.content = content.trim()
    Object.freeze(this)
  }
}
