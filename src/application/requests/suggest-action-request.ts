import { ValidationError } from '../../domain/index.js'

export class SuggestActionRequest {
  readonly ideaId: string
  readonly analysisId?: string

  constructor(ideaId: string, analysisId?: string) {
    if (!ideaId || ideaId.trim() === '') {
      throw new ValidationError('Idea ID is required')
    }
    this.ideaId = ideaId.trim()
    this.analysisId = analysisId?.trim() || undefined
    Object.freeze(this)
  }
}
