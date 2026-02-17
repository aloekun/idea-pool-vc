import { describe, it, expect, beforeEach } from 'vitest'
import { AppendChunkUseCase } from './append-chunk-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/mock-idea-repository.js'
import { Idea, IdeaId } from '../../domain/index.js'

describe('AppendChunkUseCase', () => {
  let repository: MockIdeaRepository
  let useCase: AppendChunkUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    useCase = new AppendChunkUseCase(repository)
  })

  it('should successfully append a chunk to an existing idea', async () => {
    const idea = Idea.create('Original idea')
    await repository.save(idea)

    const result = await useCase.execute(idea.id, 'Additional content')

    expect(result.isSuccess).toBe(true)
    if (result.isSuccess) {
      expect(result.value.content).toBe('Additional content')
    }
  })

  it('should update the repository with the new chunk', async () => {
    const idea = Idea.create('Original idea')
    await repository.save(idea)

    await useCase.execute(idea.id, 'Additional content')

    const updated = await repository.findById(idea.id)
    expect(updated?.chunks).toHaveLength(1)
    expect(updated?.chunks[0].content).toBe('Additional content')
  })

  it('should preserve original idea content when appending', async () => {
    const idea = Idea.create('Original idea')
    await repository.save(idea)

    await useCase.execute(idea.id, 'Additional content')

    const updated = await repository.findById(idea.id)
    expect(updated?.content).toBe('Original idea')
  })

  it('should return NotFoundError for non-existent idea', async () => {
    const fakeId = IdeaId.generate()
    const result = await useCase.execute(fakeId, 'content')

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })

  it('should return failure for empty content', async () => {
    const idea = Idea.create('Original idea')
    await repository.save(idea)

    const result = await useCase.execute(idea.id, '')

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })
})
