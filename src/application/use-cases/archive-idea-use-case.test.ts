import { describe, it, expect, beforeEach } from 'vitest'
import { ArchiveIdeaUseCase } from './archive-idea-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/mock-idea-repository.js'
import { Idea, IdeaId } from '../../domain/index.js'

describe('ArchiveIdeaUseCase', () => {
  let repository: MockIdeaRepository
  let useCase: ArchiveIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    useCase = new ArchiveIdeaUseCase(repository)
  })

  it('should successfully archive an active idea', async () => {
    const idea = Idea.create('Test idea')
    await repository.save(idea)

    const result = await useCase.execute(idea.id)

    expect(result.isSuccess).toBe(true)
  })

  it('should update the repository with archived status', async () => {
    const idea = Idea.create('Test idea')
    await repository.save(idea)

    await useCase.execute(idea.id)

    const updated = await repository.findById(idea.id)
    expect(updated?.isArchived()).toBe(true)
    expect(updated?.archivedAt).toBeInstanceOf(Date)
  })

  it('should succeed for already archived idea (idempotent)', async () => {
    const idea = Idea.create('Test idea').archive()
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
