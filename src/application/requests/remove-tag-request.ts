import { ValidationError } from '../../domain/index.js'

export class RemoveTagRequest {
  readonly ideaId: string
  readonly tagName: string

  constructor(ideaId: string, tagName: string) {
    if (!ideaId || ideaId.trim() === '') {
      throw new ValidationError('Idea ID is required')
    }
    if (!tagName || tagName.trim() === '') {
      throw new ValidationError('Tag name is required')
    }
    this.ideaId = ideaId.trim()
    this.tagName = tagName.trim()
    Object.freeze(this)
  }
}
