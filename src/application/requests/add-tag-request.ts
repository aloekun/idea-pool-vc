import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'

const addTagSchema = z.object({
  ideaId: z.string().trim().min(1, 'Idea ID is required'),
  tagName: z.string().trim().min(1, 'Tag name is required'),
  tagCategory: z.string().trim().min(1, 'Tag category is required'),
})

export class AddTagRequest {
  readonly ideaId: string
  readonly tagName: string
  readonly tagCategory: string

  constructor(ideaId: string, tagName: string, tagCategory: string) {
    const result = addTagSchema.safeParse({ ideaId, tagName, tagCategory })
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }
    this.ideaId = result.data.ideaId
    this.tagName = result.data.tagName
    this.tagCategory = result.data.tagCategory
    Object.freeze(this)
  }
}
