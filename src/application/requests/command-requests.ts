import { z } from 'zod'
import { ValidationError, TAG_CATEGORIES } from '../../domain/index.js'
import type { TagCategoryType } from '../../domain/index.js'

const nonEmptyStringSchema = z.string().trim().min(1)

const addIdeaSchema = z.object({
  content: nonEmptyStringSchema,
})

const appendChunkSchema = z.object({
  ideaId: nonEmptyStringSchema,
  content: nonEmptyStringSchema,
})

const addTagSchema = z.object({
  ideaId: nonEmptyStringSchema,
  tagName: nonEmptyStringSchema,
  tagCategory: nonEmptyStringSchema,
})

const ideaIdOnlySchema = z.object({
  ideaId: nonEmptyStringSchema,
})

const removeTagSchema = z.object({
  ideaId: nonEmptyStringSchema,
  tagName: nonEmptyStringSchema,
})

export class AddIdeaRequest {
  readonly content: string

  constructor(content: string) {
    try {
      const parsed = addIdeaSchema.parse({ content })
      this.content = parsed.content
    } catch {
      throw new ValidationError('Idea content cannot be empty')
    }
    Object.freeze(this)
  }
}

export class AppendChunkRequest {
  readonly ideaId: string
  readonly content: string

  constructor(ideaId: string, content: string) {
    try {
      const parsed = appendChunkSchema.parse({ ideaId, content })
      this.ideaId = parsed.ideaId
      this.content = parsed.content
    } catch {
      if (!ideaId || ideaId.trim() === '') {
        throw new ValidationError('Idea ID cannot be empty')
      }
      throw new ValidationError('Chunk content cannot be empty')
    }
    Object.freeze(this)
  }
}

export class AddTagRequest {
  readonly ideaId: string
  readonly tagName: string
  readonly tagCategory: TagCategoryType

  constructor(ideaId: string, tagName: string, tagCategory: string) {
    try {
      const parsed = addTagSchema.parse({ ideaId, tagName, tagCategory })
      this.ideaId = parsed.ideaId
      this.tagName = parsed.tagName

      const normalizedCategory = parsed.tagCategory.toUpperCase()
      if (!TAG_CATEGORIES.includes(normalizedCategory as TagCategoryType)) {
        throw new ValidationError(
          `Invalid tag category: ${tagCategory}. Valid categories are: ${TAG_CATEGORIES.join(', ')}`
        )
      }
      this.tagCategory = normalizedCategory as TagCategoryType
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      if (!ideaId || ideaId.trim() === '') {
        throw new ValidationError('Idea ID cannot be empty')
      }
      if (!tagName || tagName.trim() === '') {
        throw new ValidationError('Tag name cannot be empty')
      }
      throw new ValidationError('Tag category cannot be empty')
    }
    Object.freeze(this)
  }
}

export class RemoveTagRequest {
  readonly ideaId: string
  readonly tagName: string

  constructor(ideaId: string, tagName: string) {
    try {
      const parsed = removeTagSchema.parse({ ideaId, tagName })
      this.ideaId = parsed.ideaId
      this.tagName = parsed.tagName
    } catch {
      if (!ideaId || ideaId.trim() === '') {
        throw new ValidationError('Idea ID cannot be empty')
      }
      throw new ValidationError('Tag name cannot be empty')
    }
    Object.freeze(this)
  }
}

export class ArchiveIdeaRequest {
  readonly ideaId: string

  constructor(ideaId: string) {
    try {
      const parsed = ideaIdOnlySchema.parse({ ideaId })
      this.ideaId = parsed.ideaId
    } catch {
      throw new ValidationError('Idea ID cannot be empty')
    }
    Object.freeze(this)
  }
}

export class RestoreIdeaRequest {
  readonly ideaId: string

  constructor(ideaId: string) {
    try {
      const parsed = ideaIdOnlySchema.parse({ ideaId })
      this.ideaId = parsed.ideaId
    } catch {
      throw new ValidationError('Idea ID cannot be empty')
    }
    Object.freeze(this)
  }
}
