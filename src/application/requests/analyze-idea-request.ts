import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'

const AnalyzeIdeaRequestSchema = z.object({
  ideaId: z.string().trim().min(1, 'ideaId is required'),
})

export class AnalyzeIdeaRequest {
  readonly ideaId: string

  constructor(ideaId: string) {
    const result = AnalyzeIdeaRequestSchema.safeParse({ ideaId })
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }
    this.ideaId = result.data.ideaId
    Object.freeze(this)
  }
}
