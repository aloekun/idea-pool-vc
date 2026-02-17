import { describe, it, expect, beforeEach } from 'vitest'
import { AddIdeaUseCase } from './add-idea-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/mock-idea-repository.js'

describe('AddIdeaUseCase', () => {
  let repository: MockIdeaRepository
  let useCase: AddIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    useCase = new AddIdeaUseCase(repository)
  })

  it('should successfully add an idea and return IdeaId', async () => {
    const result = await useCase.execute('My new idea')

    expect(result.isSuccess).toBe(true)
    if (result.isSuccess) {
      expect(result.value.value).toBeTruthy()
    }
  })

  it('should save the idea to the repository', async () => {
    const result = await useCase.execute('My new idea')

    expect(repository.count()).toBe(1)
    if (result.isSuccess) {
      const saved = await repository.findById(result.value)
      expect(saved).not.toBeNull()
      expect(saved?.content).toBe('My new idea')
    }
  })

  it('should return failure for empty content', async () => {
    const result = await useCase.execute('')

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should return failure for whitespace-only content', async () => {
    const result = await useCase.execute('   ')

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should trim content before saving', async () => {
    const result = await useCase.execute('  My idea  ')

    expect(result.isSuccess).toBe(true)
    if (result.isSuccess) {
      const saved = await repository.findById(result.value)
      expect(saved?.content).toBe('My idea')
    }
  })
})
