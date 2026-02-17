import { ValidationError } from '../../domain/index.js'
import type { ArchiveFilter } from '../../domain/index.js'

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
    const limit = options.limit ?? 10

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new ValidationError('limit must be a positive integer')
    }

    this.limit = limit

    if (options.tags) {
      const trimmed = options.tags.map((t) => t.trim())
      for (const tag of trimmed) {
        if (tag === '') {
          throw new ValidationError('Tag name cannot be empty')
        }
      }
      this.tags = Object.freeze([...new Set(trimmed)])
    } else {
      this.tags = Object.freeze([])
    }

    if (options.all) {
      this.archiveFilter = 'all'
    } else if (options.archived) {
      this.archiveFilter = 'archived'
    } else {
      this.archiveFilter = 'active'
    }

    Object.freeze(this)
  }
}
