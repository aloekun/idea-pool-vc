import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'

const appendChunkSchema = z.object({
  ideaId: z.string().trim().min(1, 'Idea ID is required'),
  content: z.string().trim().min(1, 'Chunk content is required'),
})

export class AppendChunkRequest {
  readonly ideaId: string
  readonly content: string

  constructor(ideaId: string, content: string) {
    const result = appendChunkSchema.safeParse({ ideaId, content })
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }
    this.ideaId = result.data.ideaId
    this.content = result.data.content
    Object.freeze(this)
  }
}
