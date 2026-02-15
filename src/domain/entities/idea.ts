import { IdeaId } from '../value-objects/index.js'
import type { Chunk } from './chunk.js'
import { Chunk as ChunkClass } from './chunk.js'
import type { Tag } from './tag.js'
import type { Analysis } from './analysis.js'

export interface IdeaProps {
  id: IdeaId
  content: string
  createdAt: Date
  archivedAt: Date | null
  chunks: readonly Chunk[]
  tags: readonly Tag[]
  analyses: readonly Analysis[]
}

export class Idea {
  readonly id: IdeaId
  readonly content: string
  readonly createdAt: Date
  readonly archivedAt: Date | null
  readonly chunks: readonly Chunk[]
  readonly tags: readonly Tag[]
  readonly analyses: readonly Analysis[]

  private constructor(props: IdeaProps) {
    this.id = props.id
    this.content = props.content
    this.createdAt = props.createdAt
    this.archivedAt = props.archivedAt
    this.chunks = Object.freeze([...props.chunks])
    this.tags = Object.freeze([...props.tags])
    this.analyses = Object.freeze([...props.analyses])
    Object.freeze(this)
  }

  static create(content: string): Idea {
    if (!content || content.trim() === '') {
      throw new Error('Idea content cannot be empty')
    }
    return new Idea({
      id: IdeaId.generate(),
      content: content.trim(),
      createdAt: new Date(),
      archivedAt: null,
      chunks: [],
      tags: [],
      analyses: [],
    })
  }

  static reconstruct(props: IdeaProps): Idea {
    return new Idea(props)
  }

  addChunk(content: string): Idea {
    const chunk = ChunkClass.create(content)
    return new Idea({
      ...this.toProps(),
      chunks: [...this.chunks, chunk],
    })
  }

  addTag(tag: Tag): Idea {
    const exists = this.tags.some((t) => t.equals(tag))
    if (exists) {
      return this
    }
    return new Idea({
      ...this.toProps(),
      tags: [...this.tags, tag],
    })
  }

  removeTag(tag: Tag): Idea {
    const filtered = this.tags.filter((t) => !t.equals(tag))
    if (filtered.length === this.tags.length) {
      return this
    }
    return new Idea({
      ...this.toProps(),
      tags: filtered,
    })
  }

  addAnalysis(analysis: Analysis): Idea {
    return new Idea({
      ...this.toProps(),
      analyses: [...this.analyses, analysis],
    })
  }

  archive(): Idea {
    if (this.archivedAt !== null) {
      return this
    }
    return new Idea({
      ...this.toProps(),
      archivedAt: new Date(),
    })
  }

  restore(): Idea {
    if (this.archivedAt === null) {
      return this
    }
    return new Idea({
      ...this.toProps(),
      archivedAt: null,
    })
  }

  isArchived(): boolean {
    return this.archivedAt !== null
  }

  private toProps(): IdeaProps {
    return {
      id: this.id,
      content: this.content,
      createdAt: this.createdAt,
      archivedAt: this.archivedAt,
      chunks: this.chunks,
      tags: this.tags,
      analyses: this.analyses,
    }
  }

  equals(other: Idea): boolean {
    return this.id.equals(other.id)
  }
}
