import { describe, it, expect, beforeEach } from 'vitest'
import { RestoreIdeaUseCase } from './restore-idea-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/mock-idea-repository.js'
import { Idea, IdeaId } from '../../domain/index.js'

describe('RestoreIdeaUseCase', () => {
  let repository: MockIdeaRepository
  let useCase: RestoreIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    useCase = new RestoreIdeaUseCase(repository)
  })

  it('should successfully restore an archived idea', async () => {
    const idea = Idea.create('Test idea').archive()
    await repository.save(idea)

    const result = await useCase.execute(idea.id)

    expect(result.isSuccess).toBe(true)
  })

  it('should update the repository with restored status', async () => {
    const idea = Idea.create('Test idea').archive()
    await repository.save(idea)

    await useCase.execute(idea.id)

    const updated = await repository.findById(idea.id)
    expect(updated?.isArchived()).toBe(false)
    expect(updated?.archivedAt).toBeNull()
  })

  it('should succeed for non-archived idea (idempotent)', async () => {
    const idea = Idea.create('Test idea')
    await repository.save(idea)

    const result = await useCase.execute(idea.id)

    expect(result.isSuccess).toBe(true)
  })

  it('should return NotFoundError for non-existent idea', async () => {
    const fakeId = IdeaId.generate()
    const result = await useCase.execute(fakeId)

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })
})
