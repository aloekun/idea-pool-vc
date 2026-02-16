import { describe, it, expect, beforeEach } from 'vitest'
import { AddTagUseCase } from './add-tag-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/mock-idea-repository.js'
import { Idea, IdeaId, Tag, TagCategory } from '../../domain/index.js'

describe('AddTagUseCase', () => {
  let repository: MockIdeaRepository
  let useCase: AddTagUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    useCase = new AddTagUseCase(repository)
  })

  it('should successfully add a tag to an existing idea', async () => {
    const idea = Idea.create('Test idea')
    await repository.save(idea)
    const tag = Tag.create('Web', TagCategory.domain())

    const result = await useCase.execute(idea.id, tag)

    expect(result.isSuccess).toBe(true)
  })

  it('should update the repository with the new tag', async () => {
    const idea = Idea.create('Test idea')
    await repository.save(idea)
    const tag = Tag.create('Web', TagCategory.domain())

    await useCase.execute(idea.id, tag)

    const updated = await repository.findById(idea.id)
    expect(updated?.tags).toHaveLength(1)
    expect(updated?.tags[0].name).toBe('Web')
  })

  it('should not add duplicate tags', async () => {
    const idea = Idea.create('Test idea')
    await repository.save(idea)
    const tag = Tag.create('Web', TagCategory.domain())

    await useCase.execute(idea.id, tag)
    await useCase.execute(idea.id, tag)

    const updated = await repository.findById(idea.id)
    expect(updated?.tags).toHaveLength(1)
  })

  it('should return NotFoundError for non-existent idea', async () => {
    const fakeId = IdeaId.generate()
    const tag = Tag.create('Web', TagCategory.domain())

    const result = await useCase.execute(fakeId, tag)

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })
})
