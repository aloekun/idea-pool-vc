import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'

const SuggestActionRequestSchema = z.object({
  ideaId: z.string().trim().min(1, 'ideaId is required'),
  analysisId: z
    .string()
    .trim()
    .min(1, 'analysisId cannot be empty when provided')
    .optional(),
})

export class SuggestActionRequest {
  readonly ideaId: string
  readonly analysisId?: string

  constructor(ideaId: string, analysisId?: string) {
    const result = SuggestActionRequestSchema.safeParse({ ideaId, analysisId })
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }
    this.ideaId = result.data.ideaId
    this.analysisId = result.data.analysisId
    Object.freeze(this)
  }
}
