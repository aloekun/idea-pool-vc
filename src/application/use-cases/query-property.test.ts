import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { ListIdeasUseCase } from './list-ideas-use-case.js'
import { ShowIdeaUseCase } from './show-idea-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/index.js'
import {
  Idea,
  IdeaId,
  Tag,
  TagCategory,
  NotFoundError,
} from '../../domain/index.js'
import { isSuccess, isFailure } from '../../shared/result.js'

describe('Feature: idea-classification-cli, Query Property Tests', () => {
  let repository: MockIdeaRepository
  let listUseCase: ListIdeasUseCase
  let showUseCase: ShowIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    listUseCase = new ListIdeasUseCase(repository)
    showUseCase = new ShowIdeaUseCase(repository)
  })

  const nonEmptyString = fc
    .string({ minLength: 1, maxLength: 200 })
    .filter((s) => s.trim().length > 0)

  const tagCategoryArb = fc.constantFrom(
    TagCategory.nature(),
    TagCategory.scale(),
    TagCategory.difficulty(),
    TagCategory.phase(),
    TagCategory.risk(),
    TagCategory.domain()
  )

  const tagArb = fc.tuple(nonEmptyString, tagCategoryArb).map(([name, cat]) =>
    Tag.create(name, cat)
  )

  describe('Property 2: Idea ID uniqueness', () => {
    it('all idea IDs are unique across any number of created ideas (100 iterations)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(nonEmptyString, { minLength: 2, maxLength: 20 }),
          async (contents) => {
            repository.clear()

            const ideas: Idea[] = []
            for (const content of contents) {
              const idea = Idea.create(content)
              await repository.save(idea)
              ideas.push(idea)
            }

            const ids = ideas.map((i) => i.id.value)
            const uniqueIds = new Set(ids)

            return uniqueIds.size === ids.length
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 7: Non-existent ID operation error', () => {
    it('show operation on non-existent ID returns NotFoundError (100 iterations)', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonEmptyString,
          async (content) => {
            repository.clear()

            const idea = Idea.create(content)
            await repository.save(idea)

            const nonExistentId = IdeaId.generate()
            const result = await showUseCase.execute(nonExistentId)

            return isFailure(result) && result.error instanceof NotFoundError
          }
        ),
        { numRuns: 100 }
      )
    })

    it('show on completely empty repository returns NotFoundError', async () => {
      repository.clear()

      const randomId = IdeaId.generate()
      const result = await showUseCase.execute(randomId)

      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error).toBeInstanceOf(NotFoundError)
      }
    })
  })

  describe('Property 8: Idea list completeness', () => {
    it('list includes all idea IDs, creation dates, and content (100 iterations)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(nonEmptyString, { minLength: 1, maxLength: 10 }),
          async (contents) => {
            repository.clear()

            const ideas: Idea[] = []
            for (const content of contents) {
              const idea = Idea.create(content)
              await repository.save(idea)
              ideas.push(idea)
            }

            const result = await listUseCase.execute({
              limit: contents.length + 1,
            })

            if (!isSuccess(result)) return false

            const entities = result.value

            for (const idea of ideas) {
              const found = entities.find((e) => e.id.value === idea.id.value)
              if (!found) return false

              if (!(found.createdAt instanceof Date)) return false
              if (!found.content) return false

              const expectedStart = idea.content.substring(0, Math.min(100, idea.content.length))
              if (!found.content.startsWith(expectedStart)) return false
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 9: Idea list chronological sort (descending)', () => {
    it('list is always sorted by createdAt in descending order (100 iterations)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.integer({ min: 1, max: 100 }),
            { minLength: 2, maxLength: 15 }
          ),
          async (offsets) => {
            repository.clear()

            const now = Date.now()
            for (let i = 0; i < offsets.length; i++) {
              const idea = Idea.reconstruct({
                id: IdeaId.generate(),
                content: `Idea ${i}`,
                createdAt: new Date(now - offsets[i] * 1000),
                archivedAt: null,
                chunks: [],
                tags: [],
                analyses: [],
              })
              await repository.save(idea)
            }

            const result = await listUseCase.execute({
              limit: offsets.length + 1,
            })

            if (!isSuccess(result)) return false

            const entities = result.value
            for (let i = 1; i < entities.length; i++) {
              const prevTime = entities[i - 1].createdAt.getTime()
              const currTime = entities[i].createdAt.getTime()
              if (prevTime < currTime) return false
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 10: Idea detail completeness', () => {
    it('detail view includes all content, chunks, tags, and analyses (100 iterations)', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonEmptyString,
          fc.array(nonEmptyString, { minLength: 0, maxLength: 5 }),
          fc.array(tagArb, { minLength: 0, maxLength: 4 }),
          async (content, chunkContents, tags) => {
            repository.clear()

            let idea = Idea.create(content)

            for (const chunkContent of chunkContents) {
              idea = idea.addChunk(chunkContent)
            }

            for (const tag of tags) {
              idea = idea.addTag(tag)
            }

            await repository.save(idea)

            const result = await showUseCase.execute(idea.id)

            if (!isSuccess(result)) return false

            const entity = result.value

            if (entity.content !== content.trim()) return false
            if (entity.chunks.length !== idea.chunks.length) return false
            for (let i = 0; i < idea.chunks.length; i++) {
              if (entity.chunks[i].content !== idea.chunks[i].content) return false
            }
            if (entity.tags.length !== idea.tags.length) return false
            if (!Array.isArray(entity.analyses)) return false

            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 11: Chunk display with datetime information', () => {
    it('every chunk in detail view has a valid Date (100 iterations)', async () => {
      await fc.assert(
        fc.asyncProperty(
          nonEmptyString,
          fc.array(nonEmptyString, { minLength: 1, maxLength: 5 }),
          async (content, chunkContents) => {
            repository.clear()

            let idea = Idea.create(content)
            for (const chunkContent of chunkContents) {
              idea = idea.addChunk(chunkContent)
            }
            await repository.save(idea)

            const result = await showUseCase.execute(idea.id)

            if (!isSuccess(result)) return false

            const entity = result.value

            for (const chunk of entity.chunks) {
              if (!(chunk.createdAt instanceof Date)) return false
              if (isNaN(chunk.createdAt.getTime())) return false
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
