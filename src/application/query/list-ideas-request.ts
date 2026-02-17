import { z } from 'zod'
import { ValidationError } from '../../domain/index.js'
import type { ArchiveFilter } from '../../domain/index.js'

const listIdeasOptionsSchema = z.object({
  limit: z
    .number()
    .int({ message: 'limit must be a positive integer' })
    .positive({ message: 'limit must be a positive integer' })
    .default(10),
  tags: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
  all: z.boolean().optional(),
})

export interface ListIdeasRequestOptions {
  readonly limit?: number
  readonly tags?: readonly string[]
  readonly archived?: boolean
  readonly all?: boolean
}

export class ListIdeasRequest {
  readonly limit: number
  readonly tags: readonly string[]
  readonly archiveFilter: ArchiveFilter

  constructor(options: ListIdeasRequestOptions = {}) {
    const parsed = this.parseOptions(options)

    this.limit = parsed.limit

    if (parsed.tags) {
      const trimmed = parsed.tags.map((t) => t.trim())
      for (const tag of trimmed) {
        if (tag === '') {
          throw new ValidationError('Tag name cannot be empty')
        }
      }
      this.tags = Object.freeze([...new Set(trimmed)])
    } else {
      this.tags = Object.freeze([])
    }

    if (parsed.all) {
      this.archiveFilter = 'all'
    } else if (parsed.archived) {
      this.archiveFilter = 'archived'
    } else {
      this.archiveFilter = 'active'
    }

    Object.freeze(this)
  }

  private parseOptions(options: ListIdeasRequestOptions) {
    const result = listIdeasOptionsSchema.safeParse(options)
    if (!result.success) {
      const firstIssue = result.error.issues[0]
      throw new ValidationError(firstIssue.message)
    }
    return result.data
  }
}
