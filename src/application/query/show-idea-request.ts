import { ValidationError } from '../../domain/index.js'

export class ShowIdeaRequest {
  readonly ideaId: string

  constructor(ideaId: string) {
    const trimmed = ideaId.trim()
    if (trimmed === '') {
      throw new ValidationError('Idea ID is required')
    }

    this.ideaId = trimmed
    Object.freeze(this)
  }
}
