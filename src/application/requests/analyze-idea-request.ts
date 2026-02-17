import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'

const analyzeIdeaSchema = z.object({
  ideaId: z.string().trim().min(1, 'Idea ID is required'),
})

export class AnalyzeIdeaRequest {
  readonly ideaId: string

  constructor(ideaId: string) {
    const result = analyzeIdeaSchema.safeParse({ ideaId })
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }
    this.ideaId = result.data.ideaId
    Object.freeze(this)
  }
}
