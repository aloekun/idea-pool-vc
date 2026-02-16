import { ulid } from 'ulid'

export class ChunkId {
  private constructor(private readonly _value: string) {
    Object.freeze(this)
  }

  static generate(): ChunkId {
    return new ChunkId(ulid())
  }

  static fromString(value: string): ChunkId {
    if (!value || value.trim() === '') {
      throw new Error('ChunkId cannot be empty')
    }
    return new ChunkId(value.trim())
  }

  get value(): string {
    return this._value
  }

  equals(other: ChunkId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
