import { ValidationError } from '../../domain/index.js'

export class ArchiveIdeaRequest {
  readonly ideaId: string

  constructor(ideaId: string) {
    if (!ideaId || ideaId.trim() === '') {
      throw new ValidationError('Idea ID is required')
    }
    this.ideaId = ideaId.trim()
    Object.freeze(this)
  }
}
