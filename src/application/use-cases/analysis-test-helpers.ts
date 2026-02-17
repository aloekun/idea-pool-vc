import * as fc from 'fast-check'
import { TagCategory } from '../../domain/index.js'

export const NUM_RUNS = 100

export const nonEmptyStringArb = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim().length > 0)

export const tagArb = fc.record({
  name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  category: fc.constantFrom(
    TagCategory.nature(),
    TagCategory.scale(),
    TagCategory.difficulty(),
    TagCategory.phase(),
    TagCategory.risk(),
    TagCategory.domain()
  ),
})
