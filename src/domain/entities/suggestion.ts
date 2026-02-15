export interface SuggestionProps {
  content: string
  reasoning: string
}

export class Suggestion {
  readonly content: string
  readonly reasoning: string

  private constructor(props: SuggestionProps) {
    this.content = props.content
    this.reasoning = props.reasoning
    Object.freeze(this)
  }

  static create(content: string, reasoning: string): Suggestion {
    if (!content || content.trim() === '') {
      throw new Error('Suggestion content cannot be empty')
    }
    if (!reasoning || reasoning.trim() === '') {
      throw new Error('Suggestion reasoning cannot be empty')
    }
    return new Suggestion({
      content: content.trim(),
      reasoning: reasoning.trim(),
    })
  }

  static reconstruct(props: SuggestionProps): Suggestion {
    return new Suggestion(props)
  }
}
