import { ValidationError } from '../../domain/index.js'

export class SuggestActionRequest {
  readonly ideaId: string
  readonly analysisId?: string

  constructor(ideaId: string, analysisId?: string) {
    if (!ideaId || ideaId.trim() === '') {
      throw new ValidationError('ideaId is required')
    }

    if (analysisId !== undefined && analysisId.trim() === '') {
      throw new ValidationError('analysisId cannot be empty when provided')
    }

    this.ideaId = ideaId.trim()
    this.analysisId = analysisId?.trim()
    Object.freeze(this)
  }
}
