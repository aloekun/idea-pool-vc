import { ValidationError } from '../../domain/index.js'

export class AddIdeaRequest {
  readonly content: string

  constructor(content: string) {
    if (!content || content.trim() === '') {
      throw new ValidationError('Idea content is required')
    }
    this.content = content.trim()
    Object.freeze(this)
  }
}
