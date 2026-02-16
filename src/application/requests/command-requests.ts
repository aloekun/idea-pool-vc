import { ValidationError, TAG_CATEGORIES } from '../../domain/index.js'
import type { TagCategoryType } from '../../domain/index.js'

export class AddIdeaRequest {
  readonly content: string

  constructor(content: string) {
    if (!content || content.trim() === '') {
      throw new ValidationError('Idea content cannot be empty')
    }
    this.content = content.trim()
    Object.freeze(this)
  }
}

export class AppendChunkRequest {
  readonly ideaId: string
  readonly content: string

  constructor(ideaId: string, content: string) {
    if (!ideaId || ideaId.trim() === '') {
      throw new ValidationError('Idea ID cannot be empty')
    }
    if (!content || content.trim() === '') {
      throw new ValidationError('Chunk content cannot be empty')
    }
    this.ideaId = ideaId.trim()
    this.content = content.trim()
    Object.freeze(this)
  }
}

export class AddTagRequest {
  readonly ideaId: string
  readonly tagName: string
  readonly tagCategory: TagCategoryType

  constructor(ideaId: string, tagName: string, tagCategory: string) {
    if (!ideaId || ideaId.trim() === '') {
      throw new ValidationError('Idea ID cannot be empty')
    }
    if (!tagName || tagName.trim() === '') {
      throw new ValidationError('Tag name cannot be empty')
    }
    if (!tagCategory || tagCategory.trim() === '') {
      throw new ValidationError('Tag category cannot be empty')
    }

    const normalizedCategory = tagCategory.trim().toUpperCase()
    if (!TAG_CATEGORIES.includes(normalizedCategory as TagCategoryType)) {
      throw new ValidationError(
        `Invalid tag category: ${tagCategory}. Valid categories are: ${TAG_CATEGORIES.join(', ')}`
      )
    }

    this.ideaId = ideaId.trim()
    this.tagName = tagName.trim()
    this.tagCategory = normalizedCategory as TagCategoryType
    Object.freeze(this)
  }
}

export class RemoveTagRequest {
  readonly ideaId: string
  readonly tagName: string

  constructor(ideaId: string, tagName: string) {
    if (!ideaId || ideaId.trim() === '') {
      throw new ValidationError('Idea ID cannot be empty')
    }
    if (!tagName || tagName.trim() === '') {
      throw new ValidationError('Tag name cannot be empty')
    }
    this.ideaId = ideaId.trim()
    this.tagName = tagName.trim()
    Object.freeze(this)
  }
}

export class ArchiveIdeaRequest {
  readonly ideaId: string

  constructor(ideaId: string) {
    if (!ideaId || ideaId.trim() === '') {
      throw new ValidationError('Idea ID cannot be empty')
    }
    this.ideaId = ideaId.trim()
    Object.freeze(this)
  }
}

export class RestoreIdeaRequest {
  readonly ideaId: string

  constructor(ideaId: string) {
    if (!ideaId || ideaId.trim() === '') {
      throw new ValidationError('Idea ID cannot be empty')
    }
    this.ideaId = ideaId.trim()
    Object.freeze(this)
  }
}
