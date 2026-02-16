import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { AddIdeaUseCase } from './add-idea-use-case.js'
import { AppendChunkUseCase } from './append-chunk-use-case.js'
import { AddTagUseCase } from './add-tag-use-case.js'
import { RemoveTagUseCase } from './remove-tag-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/mock-idea-repository.js'
import { Idea, Tag, TagCategory } from '../../domain/index.js'

// Arbitrary for non-empty strings (content)
const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0)

// Arbitrary for tag categories
const tagCategoryArb = fc.constantFrom(
  TagCategory.nature(),
  TagCategory.scale(),
  TagCategory.difficulty(),
  TagCategory.phase(),
  TagCategory.risk(),
  TagCategory.domain()
)

describe('Feature: idea-classification-cli, Property 1: Idea save roundtrip', () => {
  it('should preserve idea content on save and retrieve (100 iterations)', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyString, async (content) => {
        const repository = new MockIdeaRepository()
        const useCase = new AddIdeaUseCase(repository)

        const result = await useCase.execute(content)
        expect(result.isSuccess).toBe(true)

        if (result.isSuccess) {
          const saved = await repository.findById(result.value)
          expect(saved).not.toBeNull()
          expect(saved?.content).toBe(content.trim())
        }
      }),
      { numRuns: 100 }
    )
  })
})

describe('Feature: idea-classification-cli, Property 4: Empty string input rejection', () => {
  it('should reject empty or whitespace-only strings for idea creation (100 iterations)', async () => {
    const emptyOrWhitespace = fc.oneof(
      fc.constant(''),
      fc.stringOf(fc.constant(' ')),
      fc.stringOf(fc.constant('\t')),
      fc.stringOf(fc.constant('\n'))
    )

    await fc.assert(
      fc.asyncProperty(emptyOrWhitespace, async (content) => {
        const repository = new MockIdeaRepository()
        const useCase = new AddIdeaUseCase(repository)

        const result = await useCase.execute(content)
        expect(result.isFailure).toBe(true)

        if (result.isFailure) {
          expect(result.error.code).toBe('VALIDATION_ERROR')
        }
        expect(repository.count()).toBe(0)
      }),
      { numRuns: 100 }
    )
  })

  it('should reject empty or whitespace-only strings for chunk creation (100 iterations)', async () => {
    const emptyOrWhitespace = fc.oneof(
      fc.constant(''),
      fc.stringOf(fc.constant(' ')),
      fc.stringOf(fc.constant('\t'))
    )

    await fc.assert(
      fc.asyncProperty(emptyOrWhitespace, async (content) => {
        const repository = new MockIdeaRepository()
        const useCase = new AppendChunkUseCase(repository)
        const idea = Idea.create('Test idea')
        await repository.save(idea)

        const result = await useCase.execute(idea.id, content)
        expect(result.isFailure).toBe(true)

        if (result.isFailure) {
          expect(result.error.code).toBe('VALIDATION_ERROR')
        }
      }),
      { numRuns: 100 }
    )
  })
})

describe('Feature: idea-classification-cli, Property 5: Chunk append roundtrip', () => {
  it('should preserve chunk content on append and retrieve (100 iterations)', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyString, nonEmptyString, async (ideaContent, chunkContent) => {
        const repository = new MockIdeaRepository()
        const addIdeaUseCase = new AddIdeaUseCase(repository)
        const appendChunkUseCase = new AppendChunkUseCase(repository)

        const ideaResult = await addIdeaUseCase.execute(ideaContent)
        expect(ideaResult.isSuccess).toBe(true)

        if (ideaResult.isSuccess) {
          const chunkResult = await appendChunkUseCase.execute(ideaResult.value, chunkContent)
          expect(chunkResult.isSuccess).toBe(true)

          if (chunkResult.isSuccess) {
            expect(chunkResult.value.content).toBe(chunkContent.trim())

            const savedIdea = await repository.findById(ideaResult.value)
            expect(savedIdea).not.toBeNull()

            const savedChunk = savedIdea?.chunks.find(
              (c) => c.id.equals(chunkResult.value.id)
            )
            expect(savedChunk).toBeDefined()
            expect(savedChunk?.content).toBe(chunkContent.trim())
          }
        }
      }),
      { numRuns: 100 }
    )
  })
})

describe('Feature: idea-classification-cli, Property 6: Chunk addition immutability', () => {
  it('should not mutate original idea content when adding chunks (100 iterations)', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyString, nonEmptyString, async (ideaContent, chunkContent) => {
        const repository = new MockIdeaRepository()
        const addIdeaUseCase = new AddIdeaUseCase(repository)
        const appendChunkUseCase = new AppendChunkUseCase(repository)

        const ideaResult = await addIdeaUseCase.execute(ideaContent)
        expect(ideaResult.isSuccess).toBe(true)

        if (ideaResult.isSuccess) {
          const beforeAppend = await repository.findById(ideaResult.value)
          const originalContent = beforeAppend?.content
          const originalChunkCount = beforeAppend?.chunks.length ?? 0

          await appendChunkUseCase.execute(ideaResult.value, chunkContent)

          const afterAppend = await repository.findById(ideaResult.value)
          expect(afterAppend?.content).toBe(originalContent)
          expect(afterAppend?.chunks.length).toBe(originalChunkCount + 1)
        }
      }),
      { numRuns: 100 }
    )
  })
})

describe('Feature: idea-classification-cli, Property 15: Tag add roundtrip', () => {
  it('should preserve tag after adding to an idea (100 iterations)', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyString,
        nonEmptyString,
        tagCategoryArb,
        async (ideaContent, tagName, category) => {
          const repository = new MockIdeaRepository()
          const addIdeaUseCase = new AddIdeaUseCase(repository)
          const addTagUseCase = new AddTagUseCase(repository)

          const ideaResult = await addIdeaUseCase.execute(ideaContent)
          expect(ideaResult.isSuccess).toBe(true)

          if (ideaResult.isSuccess) {
            const tag = Tag.create(tagName, category)
            const tagResult = await addTagUseCase.execute(ideaResult.value, tag)
            expect(tagResult.isSuccess).toBe(true)

            const savedIdea = await repository.findById(ideaResult.value)
            const foundTag = savedIdea?.tags.find(
              (t) => t.name === tagName.trim() && t.category.equals(category)
            )
            expect(foundTag).toBeDefined()
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Feature: idea-classification-cli, Property 16: Tag add and remove roundtrip', () => {
  it('should return to original state after add and remove (100 iterations)', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyString,
        nonEmptyString,
        tagCategoryArb,
        async (ideaContent, tagName, category) => {
          const repository = new MockIdeaRepository()
          const addIdeaUseCase = new AddIdeaUseCase(repository)
          const addTagUseCase = new AddTagUseCase(repository)
          const removeTagUseCase = new RemoveTagUseCase(repository)

          const ideaResult = await addIdeaUseCase.execute(ideaContent)
          expect(ideaResult.isSuccess).toBe(true)

          if (ideaResult.isSuccess) {
            const beforeTagCount =
              (await repository.findById(ideaResult.value))?.tags.length ?? 0

            const tag = Tag.create(tagName, category)
            await addTagUseCase.execute(ideaResult.value, tag)

            const afterAdd = await repository.findById(ideaResult.value)
            expect(afterAdd?.tags.length).toBe(beforeTagCount + 1)

            await removeTagUseCase.execute(ideaResult.value, tagName.trim())

            const afterRemove = await repository.findById(ideaResult.value)
            expect(afterRemove?.tags.length).toBe(beforeTagCount)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
