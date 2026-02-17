import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'

const suggestActionSchema = z.object({
  ideaId: z.string().trim().min(1, 'Idea ID is required'),
  analysisId: z.string().trim().min(1, 'Analysis ID cannot be empty').optional(),
})

export class SuggestActionRequest {
  readonly ideaId: string
  readonly analysisId?: string

  constructor(ideaId: string, analysisId?: string) {
    const result = suggestActionSchema.safeParse({ ideaId, analysisId })
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }
    this.ideaId = result.data.ideaId
    this.analysisId = result.data.analysisId
    Object.freeze(this)
  }
}
