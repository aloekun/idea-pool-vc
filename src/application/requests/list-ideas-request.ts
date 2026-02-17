import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'

const listIdeasSchema = z.object({
  limit: z.number().int().min(1, 'Limit must be a positive number').optional(),
  tags: z.array(z.string()).optional(),
  includeArchived: z.boolean().optional(),
  archivedOnly: z.boolean().optional(),
})

export class ListIdeasRequest {
  readonly limit?: number
  readonly tags: readonly string[]
  readonly includeArchived: boolean
  readonly archivedOnly: boolean

  constructor(options?: {
    limit?: number
    tags?: readonly string[]
    includeArchived?: boolean
    archivedOnly?: boolean
  }) {
    const result = listIdeasSchema.safeParse(options ?? {})
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }
    this.limit = result.data.limit
    const tags = result.data.tags ? [...result.data.tags] : []
    this.tags = Object.freeze(tags)
    this.includeArchived = result.data.includeArchived ?? false
    this.archivedOnly = result.data.archivedOnly ?? false
    Object.freeze(this)
  }
}
