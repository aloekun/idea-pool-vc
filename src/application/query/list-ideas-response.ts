import type { IdeaSummary } from '../dto/index.js'

export interface ListIdeasResponse {
  readonly ideas: readonly IdeaSummary[]
  readonly total: number
}
