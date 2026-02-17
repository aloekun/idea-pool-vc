import { describe, it, expect, beforeEach } from 'vitest'
import { RemoveTagUseCase } from './remove-tag-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/mock-idea-repository.js'
import { Idea, IdeaId, Tag, TagCategory } from '../../domain/index.js'

describe('RemoveTagUseCase', () => {
  let repository: MockIdeaRepository
  let useCase: RemoveTagUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    useCase = new RemoveTagUseCase(repository)
  })

  it('should successfully remove a tag from an idea by name', async () => {
    const tag = Tag.create('Web', TagCategory.domain())
    const idea = Idea.create('Test idea').addTag(tag)
    await repository.save(idea)

    const result = await useCase.execute(idea.id, 'Web')

    expect(result.isSuccess).toBe(true)
  })

  it('should update the repository after tag removal', async () => {
    const tag = Tag.create('Web', TagCategory.domain())
    const idea = Idea.create('Test idea').addTag(tag)
    await repository.save(idea)

    await useCase.execute(idea.id, 'Web')

    const updated = await repository.findById(idea.id)
    expect(updated?.tags).toHaveLength(0)
  })

  it('should succeed even if tag does not exist on idea', async () => {
    const idea = Idea.create('Test idea')
    await repository.save(idea)

    const result = await useCase.execute(idea.id, 'Web')

    expect(result.isSuccess).toBe(true)
  })

  it('should return NotFoundError for non-existent idea', async () => {
    const fakeId = IdeaId.generate()

    const result = await useCase.execute(fakeId, 'Web')

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })
})
