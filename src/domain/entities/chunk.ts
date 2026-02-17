import { ChunkId } from '../value-objects/index.js'
import { ValidationError } from '../errors/index.js'

export interface ChunkProps {
  id: ChunkId
  content: string
  createdAt: Date
}

export class Chunk {
  readonly id: ChunkId
  readonly content: string
  readonly createdAt: Date

  private constructor(props: ChunkProps) {
    this.id = props.id
    this.content = props.content
    this.createdAt = new Date(props.createdAt.getTime())
    Object.freeze(this)
  }

  static create(content: string): Chunk {
    if (!content || content.trim() === '') {
      throw new ValidationError('Chunk content cannot be empty')
    }
    return new Chunk({
      id: ChunkId.generate(),
      content: content.trim(),
      createdAt: new Date(),
    })
  }

  static reconstruct(props: ChunkProps): Chunk {
    return new Chunk(props)
  }

  equals(other: Chunk): boolean {
    return this.id.equals(other.id)
  }
}
