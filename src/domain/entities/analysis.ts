import { AnalysisId } from '../value-objects/index.js'
import type { Tag } from './tag.js'
import type { Suggestion } from './suggestion.js'

export interface AnalysisProps {
  id: AnalysisId
  generatedTags: readonly Tag[]
  suggestion: Suggestion | null
  createdAt: Date
}

export class Analysis {
  readonly id: AnalysisId
  readonly generatedTags: readonly Tag[]
  readonly suggestion: Suggestion | null
  readonly createdAt: Date

  private constructor(props: AnalysisProps) {
    this.id = props.id
    this.generatedTags = Object.freeze([...props.generatedTags])
    this.suggestion = props.suggestion
    this.createdAt = props.createdAt
    Object.freeze(this)
  }

  static createWithTags(tags: readonly Tag[]): Analysis {
    return new Analysis({
      id: AnalysisId.generate(),
      generatedTags: tags,
      suggestion: null,
      createdAt: new Date(),
    })
  }

  static createWithSuggestion(
    suggestion: Suggestion,
    tags: readonly Tag[] = []
  ): Analysis {
    return new Analysis({
      id: AnalysisId.generate(),
      generatedTags: tags,
      suggestion,
      createdAt: new Date(),
    })
  }

  static reconstruct(props: AnalysisProps): Analysis {
    return new Analysis(props)
  }

  withSuggestion(suggestion: Suggestion): Analysis {
    return new Analysis({
      id: this.id,
      generatedTags: this.generatedTags,
      suggestion,
      createdAt: this.createdAt,
    })
  }

  equals(other: Analysis): boolean {
    return this.id.equals(other.id)
  }
}
