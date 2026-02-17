import { describe, it, expect, beforeEach } from 'vitest'
import { ShowIdeaUseCase } from './show-idea-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/index.js'
import {
  Idea,
  IdeaId,
  Tag,
  TagCategory,
  Analysis,
  Suggestion,
  NotFoundError,
} from '../../domain/index.js'
import { isSuccess, isFailure } from '../../shared/result.js'

describe('ShowIdeaUseCase', () => {
  let repository: MockIdeaRepository
  let useCase: ShowIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    useCase = new ShowIdeaUseCase(repository)
  })

  describe('successful retrieval', () => {
    it('should return idea detail for existing idea', async () => {
      const idea = Idea.create('Test idea content')
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        const detail = result.value
        expect(detail.id).toBe(idea.id.value)
        expect(detail.content).toBe('Test idea content')
        expect(detail.chunks).toEqual([])
        expect(detail.tags).toEqual([])
        expect(detail.analyses).toEqual([])
        expect(detail.archivedAt).toBeNull()
      }
    })

    it('should include chunks with timestamps', async () => {
      let idea = Idea.create('Main idea')
      idea = idea.addChunk('First chunk')
      idea = idea.addChunk('Second chunk')
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        const detail = result.value
        expect(detail.chunks).toHaveLength(2)
        expect(detail.chunks[0].content).toBe('First chunk')
        expect(detail.chunks[0].createdAt).toBeDefined()
        expect(detail.chunks[1].content).toBe('Second chunk')
        expect(detail.chunks[1].createdAt).toBeDefined()
      }
    })

    it('should include tags', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      const largeTag = Tag.create('Large', TagCategory.scale())
      let idea = Idea.create('Tagged idea')
      idea = idea.addTag(webTag).addTag(largeTag)
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        const detail = result.value
        expect(detail.tags).toHaveLength(2)
        expect(detail.tags).toContainEqual({ name: 'Web', category: 'DOMAIN' })
        expect(detail.tags).toContainEqual({ name: 'Large', category: 'SCALE' })
      }
    })

    it('should include analyses with suggestions', async () => {
      const suggestion = Suggestion.create('Try this approach', 'Because it works')
      const tags = [Tag.create('Web', TagCategory.domain())]
      const analysis = Analysis.createWithSuggestion(suggestion, tags)

      let idea = Idea.create('Analyzed idea')
      idea = idea.addAnalysis(analysis)
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        const detail = result.value
        expect(detail.analyses).toHaveLength(1)
        expect(detail.analyses[0].id).toBe(analysis.id.value)
        expect(detail.analyses[0].generatedTags).toHaveLength(1)
        expect(detail.analyses[0].suggestion).toEqual({
          content: 'Try this approach',
          reasoning: 'Because it works',
        })
        expect(detail.analyses[0].createdAt).toBeDefined()
      }
    })

    it('should show archived status', async () => {
      const idea = Idea.create('Archived idea').archive()
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value.archivedAt).not.toBeNull()
      }
    })

    it('should return full untruncated content', async () => {
      const longContent = 'A'.repeat(500)
      const idea = Idea.create(longContent)
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value.content).toBe(longContent)
      }
    })
  })

  describe('error handling', () => {
    it('should return NotFoundError for non-existent idea', async () => {
      const nonExistentId = IdeaId.generate()

      const result = await useCase.execute(nonExistentId)

      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error).toBeInstanceOf(NotFoundError)
        expect(result.error.message).toContain(nonExistentId.value)
      }
    })
  })
})
