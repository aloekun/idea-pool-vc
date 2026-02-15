import { TagCategory } from '../value-objects/index.js'

export interface TagProps {
  name: string
  category: TagCategory
}

export class Tag {
  readonly name: string
  readonly category: TagCategory

  private constructor(props: TagProps) {
    this.name = props.name
    this.category = props.category
    Object.freeze(this)
  }

  static create(name: string, category: TagCategory): Tag {
    if (!name || name.trim() === '') {
      throw new Error('Tag name cannot be empty')
    }
    return new Tag({
      name: name.trim(),
      category,
    })
  }

  static reconstruct(name: string, category: TagCategory): Tag {
    return new Tag({ name, category })
  }

  equals(other: Tag): boolean {
    return this.name === other.name && this.category.equals(other.category)
  }
}
