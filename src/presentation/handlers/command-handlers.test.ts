import { describe, it, expect, beforeEach } from 'vitest'
import {
  handleAddCommand,
  handleAppendCommand,
  handleAddTagCommand,
  handleRemoveTagCommand,
  handleArchiveCommand,
  handleRestoreCommand,
} from './command-handlers.js'
import { IdeaCommandAPI } from '../../application/api/idea-command-api.js'
import { AddIdeaUseCase } from '../../application/use-cases/add-idea-use-case.js'
import { AppendChunkUseCase } from '../../application/use-cases/append-chunk-use-case.js'
import { AddTagUseCase } from '../../application/use-cases/add-tag-use-case.js'
import { RemoveTagUseCase } from '../../application/use-cases/remove-tag-use-case.js'
import { ArchiveIdeaUseCase } from '../../application/use-cases/archive-idea-use-case.js'
import { RestoreIdeaUseCase } from '../../application/use-cases/restore-idea-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/mock-idea-repository.js'
import { Idea, Tag, TagCategory } from '../../domain/index.js'

describe('Command Handlers', () => {
  let repository: MockIdeaRepository
  let api: IdeaCommandAPI
  let output: string[]

  function createOutputWriter(): (message: string) => void {
    return (message: string) => {
      output.push(message)
    }
  }

  beforeEach(() => {
    repository = new MockIdeaRepository()
    api = new IdeaCommandAPI(
      new AddIdeaUseCase(repository),
      new AppendChunkUseCase(repository),
      new AddTagUseCase(repository),
      new RemoveTagUseCase(repository),
      new ArchiveIdeaUseCase(repository),
      new RestoreIdeaUseCase(repository)
    )
    output = []
  })

  describe('handleAddCommand', () => {
    it('should output success message when idea is added', async () => {
      await handleAddCommand(api, 'My new idea', createOutputWriter())

      expect(output.some((msg) => msg.includes('ID:'))).toBe(true)
      expect(repository.count()).toBe(1)
    })

    it('should output error message for empty content', async () => {
      await handleAddCommand(api, '', createOutputWriter())

      expect(output.some((msg) => msg.includes('Error'))).toBe(true)
      expect(repository.count()).toBe(0)
    })
  })

  describe('handleAppendCommand', () => {
    it('should output success message when chunk is appended', async () => {
      const idea = Idea.create('Test idea')
      await repository.save(idea)

      await handleAppendCommand(api, idea.id.value, 'Additional content', createOutputWriter())

      expect(output.some((msg) => msg.includes('Chunk'))).toBe(true)
    })

    it('should output error for non-existent idea', async () => {
      await handleAppendCommand(api, 'nonexistent', 'content', createOutputWriter())

      expect(output.some((msg) => msg.includes('Error'))).toBe(true)
    })
  })

  describe('handleAddTagCommand', () => {
    it('should output success message when tag is added', async () => {
      const idea = Idea.create('Test idea')
      await repository.save(idea)

      await handleAddTagCommand(api, idea.id.value, 'Web', 'DOMAIN', createOutputWriter())

      expect(output.some((msg) => msg.includes('Web'))).toBe(true)
    })

    it('should output error for non-existent idea', async () => {
      await handleAddTagCommand(api, 'nonexistent', 'Web', 'DOMAIN', createOutputWriter())

      expect(output.some((msg) => msg.includes('Error'))).toBe(true)
    })

    it('should output error for invalid category', async () => {
      const idea = Idea.create('Test idea')
      await repository.save(idea)

      await handleAddTagCommand(api, idea.id.value, 'Web', 'INVALID', createOutputWriter())

      expect(output.some((msg) => msg.includes('Error'))).toBe(true)
    })
  })

  describe('handleRemoveTagCommand', () => {
    it('should output success message when tag is removed', async () => {
      const tag = Tag.create('Web', TagCategory.domain())
      const idea = Idea.create('Test idea').addTag(tag)
      await repository.save(idea)

      await handleRemoveTagCommand(api, idea.id.value, 'Web', createOutputWriter())

      expect(output.some((msg) => msg.includes('Web'))).toBe(true)
    })

    it('should output error for non-existent idea', async () => {
      await handleRemoveTagCommand(api, 'nonexistent', 'Web', createOutputWriter())

      expect(output.some((msg) => msg.includes('Error'))).toBe(true)
    })
  })

  describe('handleArchiveCommand', () => {
    it('should output success message when idea is archived', async () => {
      const idea = Idea.create('Test idea')
      await repository.save(idea)

      await handleArchiveCommand(api, idea.id.value, createOutputWriter())

      expect(output.some((msg) => msg.includes('archived') || msg.includes('Archived'))).toBe(true)
    })

    it('should output error for non-existent idea', async () => {
      await handleArchiveCommand(api, 'nonexistent', createOutputWriter())

      expect(output.some((msg) => msg.includes('Error'))).toBe(true)
    })
  })

  describe('handleRestoreCommand', () => {
    it('should output success message when idea is restored', async () => {
      const idea = Idea.create('Test idea').archive()
      await repository.save(idea)

      await handleRestoreCommand(api, idea.id.value, createOutputWriter())

      expect(output.some((msg) => msg.includes('restored') || msg.includes('Restored'))).toBe(true)
    })

    it('should output error for non-existent idea', async () => {
      await handleRestoreCommand(api, 'nonexistent', createOutputWriter())

      expect(output.some((msg) => msg.includes('Error'))).toBe(true)
    })
  })
})
