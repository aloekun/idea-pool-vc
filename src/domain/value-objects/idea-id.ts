import { ulid } from 'ulid'

export class IdeaId {
  private constructor(private readonly _value: string) {
    Object.freeze(this)
  }

  static generate(): IdeaId {
    return new IdeaId(ulid())
  }

  static fromString(value: string): IdeaId {
    if (!value || value.trim() === '') {
      throw new Error('IdeaId cannot be empty')
    }
    return new IdeaId(value.trim())
  }

  get value(): string {
    return this._value
  }

  equals(other: IdeaId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
