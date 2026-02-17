import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'

const removeTagSchema = z.object({
  ideaId: z.string().trim().min(1, 'Idea ID is required'),
  tagName: z.string().trim().min(1, 'Tag name is required'),
})

export class RemoveTagRequest {
  readonly ideaId: string
  readonly tagName: string

  constructor(ideaId: string, tagName: string) {
    const result = removeTagSchema.safeParse({ ideaId, tagName })
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }
    this.ideaId = result.data.ideaId
    this.tagName = result.data.tagName
    Object.freeze(this)
  }
}
