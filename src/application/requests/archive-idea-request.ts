import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'

const archiveIdeaSchema = z.object({
  ideaId: z.string().trim().min(1, 'Idea ID is required'),
})

export class ArchiveIdeaRequest {
  readonly ideaId: string

  constructor(ideaId: string) {
    const result = archiveIdeaSchema.safeParse({ ideaId })
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }
    this.ideaId = result.data.ideaId
    Object.freeze(this)
  }
}
