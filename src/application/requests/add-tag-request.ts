import { ValidationError } from '../../domain/index.js'

export class AddTagRequest {
  readonly ideaId: string
  readonly tagName: string
  readonly tagCategory: string

  constructor(ideaId: string, tagName: string, tagCategory: string) {
    if (!ideaId || ideaId.trim() === '') {
      throw new ValidationError('Idea ID is required')
    }
    if (!tagName || tagName.trim() === '') {
      throw new ValidationError('Tag name is required')
    }
    if (!tagCategory || tagCategory.trim() === '') {
      throw new ValidationError('Tag category is required')
    }
    this.ideaId = ideaId.trim()
    this.tagName = tagName.trim()
    this.tagCategory = tagCategory.trim()
    Object.freeze(this)
  }
}
