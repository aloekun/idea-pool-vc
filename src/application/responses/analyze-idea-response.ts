import type { TagDTO } from '../dto/index.js'

export interface AnalyzeIdeaResponse {
  readonly analysisId: string
  readonly generatedTags: readonly TagDTO[]
  readonly createdAt: string
}
