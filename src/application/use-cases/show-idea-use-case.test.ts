import { describe, it, expect, beforeEach, vi } from 'vitest'
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
  DatabaseError,
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
    it('should return Idea entity for existing idea', async () => {
      const idea = Idea.create('Test idea content')
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        const entity = result.value
        expect(entity.id.value).toBe(idea.id.value)
        expect(entity.content).toBe('Test idea content')
        expect(entity.chunks).toHaveLength(0)
        expect(entity.tags).toHaveLength(0)
        expect(entity.analyses).toHaveLength(0)
        expect(entity.archivedAt).toBeNull()
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
        const entity = result.value
        expect(entity.chunks).toHaveLength(2)
        expect(entity.chunks[0].content).toBe('First chunk')
        expect(entity.chunks[0].createdAt).toBeInstanceOf(Date)
        expect(entity.chunks[1].content).toBe('Second chunk')
        expect(entity.chunks[1].createdAt).toBeInstanceOf(Date)
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
        const entity = result.value
        expect(entity.tags).toHaveLength(2)
        expect(entity.tags.some((t) => t.name === 'Web' && t.category.value === 'DOMAIN')).toBe(true)
        expect(entity.tags.some((t) => t.name === 'Large' && t.category.value === 'SCALE')).toBe(true)
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
        const entity = result.value
        expect(entity.analyses).toHaveLength(1)
        expect(entity.analyses[0].id.value).toBe(analysis.id.value)
        expect(entity.analyses[0].generatedTags).toHaveLength(1)
        expect(entity.analyses[0].suggestion?.content).toBe('Try this approach')
        expect(entity.analyses[0].suggestion?.reasoning).toBe('Because it works')
        expect(entity.analyses[0].createdAt).toBeInstanceOf(Date)
      }
    })

    it('should show archived status', async () => {
      const idea = Idea.create('Archived idea').archive()
      await repository.save(idea)

      const result = await useCase.execute(idea.id)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.value.archivedAt).toBeInstanceOf(Date)
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
      }
    })

    it('should return DatabaseError when repository throws', async () => {
      const ideaId = IdeaId.generate()
      vi.spyOn(repository, 'findById').mockRejectedValueOnce(
        new Error('Connection failed')
      )

      const result = await useCase.execute(ideaId)

      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error).toBeInstanceOf(DatabaseError)
      }
    })
  })
})
