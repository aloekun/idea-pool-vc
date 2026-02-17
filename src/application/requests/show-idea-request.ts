import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'

const showIdeaSchema = z.object({
  ideaId: z.string().trim().min(1, 'Idea ID is required'),
})

export class ShowIdeaRequest {
  readonly ideaId: string

  constructor(ideaId: string) {
    const result = showIdeaSchema.safeParse({ ideaId })
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }
    this.ideaId = result.data.ideaId
    Object.freeze(this)
  }
}
