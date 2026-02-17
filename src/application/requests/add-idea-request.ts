import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'

const addIdeaSchema = z.object({
  content: z.string().trim().min(1, 'Idea content is required'),
})

export class AddIdeaRequest {
  readonly content: string

  constructor(content: string) {
    const result = addIdeaSchema.safeParse({ content })
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }
    this.content = result.data.content
    Object.freeze(this)
  }
}
