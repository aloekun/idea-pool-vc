import { describe, it, expect, beforeEach } from 'vitest'
import { ShowCommandHandler } from './show-command-handler.js'
import { IdeaQueryAPI } from '../../application/api/idea-query-api.js'
import { ListIdeasUseCase } from '../../application/usecases/list-ideas-use-case.js'
import { ShowIdeaUseCase } from '../../application/usecases/show-idea-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/index.js'
import {
  Idea,
  Tag,
  TagCategory,
  Analysis,
  Suggestion,
} from '../../domain/index.js'

describe('ShowCommandHandler', () => {
  let repository: MockIdeaRepository
  let api: IdeaQueryAPI
  let handler: ShowCommandHandler
  let output: string[]

  beforeEach(() => {
    repository = new MockIdeaRepository()
    const listUseCase = new ListIdeasUseCase(repository)
    const showUseCase = new ShowIdeaUseCase(repository)
    api = new IdeaQueryAPI(listUseCase, showUseCase)
    output = []
    handler = new ShowCommandHandler(api, (msg: string) => {
      output.push(msg)
    })
  })

  describe('successful display', () => {
    it('should display idea detail', async () => {
      const idea = Idea.create('My detailed idea')
      await repository.save(idea)

      await handler.handle(idea.id.value)

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain(idea.id.value)
      expect(fullOutput).toContain('My detailed idea')
    })

    it('should display chunks with timestamps', async () => {
      let idea = Idea.create('Main content')
      idea = idea.addChunk('First note')
      idea = idea.addChunk('Second note')
      await repository.save(idea)

      await handler.handle(idea.id.value)

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('First note')
      expect(fullOutput).toContain('Second note')
    })

    it('should display tags', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      const largeTag = Tag.create('Large', TagCategory.scale())
      const idea = Idea.create('Tagged idea').addTag(webTag).addTag(largeTag)
      await repository.save(idea)

      await handler.handle(idea.id.value)

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('Web')
      expect(fullOutput).toContain('DOMAIN')
      expect(fullOutput).toContain('Large')
      expect(fullOutput).toContain('SCALE')
    })

    it('should display analyses with suggestions', async () => {
      const suggestion = Suggestion.create(
        'Start with a prototype',
        'To validate assumptions'
      )
      const analysis = Analysis.createWithSuggestion(suggestion, [
        Tag.create('Web', TagCategory.domain()),
      ])

      const idea = Idea.create('Analyzed idea').addAnalysis(analysis)
      await repository.save(idea)

      await handler.handle(idea.id.value)

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('Start with a prototype')
      expect(fullOutput).toContain('To validate assumptions')
    })

    it('should display archived status for archived ideas', async () => {
      const idea = Idea.create('Archived idea').archive()
      await repository.save(idea)

      await handler.handle(idea.id.value)

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('Archived idea')
    })

    it('should display full untruncated content', async () => {
      const longContent = 'A'.repeat(300)
      const idea = Idea.create(longContent)
      await repository.save(idea)

      await handler.handle(idea.id.value)

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain(longContent)
    })
  })

  describe('error handling', () => {
    it('should display error for non-existent idea', async () => {
      await handler.handle('01H5X8K2QJ3FT9VG0N6Y7MPWRS')

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('01H5X8K2QJ3FT9VG0N6Y7MPWRS')
    })

    it('should display error for empty idea id', async () => {
      await handler.handle('')

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('Idea ID is required')
    })

    it('should display error for whitespace-only idea id', async () => {
      await handler.handle('   ')

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('Idea ID is required')
    })
  })
})
