import type { SuggestionDTO } from '../dto/index.js'

export interface SuggestActionResponse {
  readonly analysisId: string
  readonly usedAnalysisId: string
  readonly suggestion: SuggestionDTO
  readonly createdAt: string
}
