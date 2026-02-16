export const TAG_CATEGORIES = [
  'NATURE',
  'SCALE',
  'DIFFICULTY',
  'PHASE',
  'RISK',
  'DOMAIN',
] as const

export type TagCategoryType = (typeof TAG_CATEGORIES)[number]

export class TagCategory {
  private constructor(private readonly _value: TagCategoryType) {
    Object.freeze(this)
  }

  static fromString(value: string): TagCategory {
    const normalized = value.trim().toUpperCase()
    if (!TAG_CATEGORIES.includes(normalized as TagCategoryType)) {
      throw new Error(
        `Invalid tag category: ${value}. Valid categories are: ${TAG_CATEGORIES.join(', ')}`
      )
    }
    return new TagCategory(normalized as TagCategoryType)
  }

  static nature(): TagCategory {
    return new TagCategory('NATURE')
  }

  static scale(): TagCategory {
    return new TagCategory('SCALE')
  }

  static difficulty(): TagCategory {
    return new TagCategory('DIFFICULTY')
  }

  static phase(): TagCategory {
    return new TagCategory('PHASE')
  }

  static risk(): TagCategory {
    return new TagCategory('RISK')
  }

  static domain(): TagCategory {
    return new TagCategory('DOMAIN')
  }

  get value(): TagCategoryType {
    return this._value
  }

  equals(other: TagCategory): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
