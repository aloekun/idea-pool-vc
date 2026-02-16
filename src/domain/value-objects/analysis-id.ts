import { ulid } from 'ulid'

export class AnalysisId {
  private constructor(private readonly _value: string) {
    Object.freeze(this)
  }

  static generate(): AnalysisId {
    return new AnalysisId(ulid())
  }

  static fromString(value: string): AnalysisId {
    if (!value || value.trim() === '') {
      throw new Error('AnalysisId cannot be empty')
    }
    return new AnalysisId(value.trim())
  }

  get value(): string {
    return this._value
  }

  equals(other: AnalysisId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
