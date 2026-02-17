import { ValidationError } from '../../domain/index.js'

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
    if (options?.limit !== undefined && options.limit < 1) {
      throw new ValidationError('Limit must be a positive number')
    }
    this.limit = options?.limit
    this.tags = options?.tags ?? []
    this.includeArchived = options?.includeArchived ?? false
    this.archivedOnly = options?.archivedOnly ?? false
    Object.freeze(this)
  }
}
