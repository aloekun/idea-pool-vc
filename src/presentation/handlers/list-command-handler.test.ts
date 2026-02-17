import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ListCommandHandler } from './list-command-handler.js'
import { IdeaQueryAPI } from '../../application/api/idea-query-api.js'
import { ListIdeasUseCase } from '../../application/usecases/list-ideas-use-case.js'
import { ShowIdeaUseCase } from '../../application/usecases/show-idea-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/index.js'
import { Idea, IdeaId, Tag, TagCategory } from '../../domain/index.js'

describe('ListCommandHandler', () => {
  let repository: MockIdeaRepository
  let api: IdeaQueryAPI
  let handler: ListCommandHandler
  let output: string[]

  beforeEach(() => {
    repository = new MockIdeaRepository()
    const listUseCase = new ListIdeasUseCase(repository)
    const showUseCase = new ShowIdeaUseCase(repository)
    api = new IdeaQueryAPI(listUseCase, showUseCase)
    output = []
    handler = new ListCommandHandler(api, (msg: string) => {
      output.push(msg)
    })
  })

  describe('basic listing', () => {
    it('should display message when no ideas exist', async () => {
      await handler.handle({})

      expect(output.some((line) => line.includes('0'))).toBe(true)
    })

    it('should display ideas with id, content and metadata', async () => {
      const idea = Idea.create('Build a web app')
      await repository.save(idea)

      await handler.handle({})

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain(idea.id.value)
      expect(fullOutput).toContain('Build a web app')
    })

    it('should display multiple ideas', async () => {
      await repository.save(Idea.create('First idea'))
      await repository.save(Idea.create('Second idea'))

      await handler.handle({})

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('First idea')
      expect(fullOutput).toContain('Second idea')
    })
  })

  describe('limit option', () => {
    it('should respect limit option', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.save(Idea.create(`Idea ${i}`))
      }

      await handler.handle({ limit: 2 })

      const fullOutput = output.join('\n')
      const ideaCount = (fullOutput.match(/Idea \d/g) || []).length
      expect(ideaCount).toBe(2)
    })
  })

  describe('tag filter', () => {
    it('should filter by tag', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      await repository.save(Idea.create('Web idea').addTag(webTag))
      await repository.save(Idea.create('Other idea'))

      await handler.handle({ tag: ['Web'] })

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('Web idea')
      expect(fullOutput).not.toContain('Other idea')
    })

    it('should handle multiple tags', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      const largeTag = Tag.create('Large', TagCategory.scale())

      await repository.save(Idea.create('Web only').addTag(webTag))
      await repository.save(
        Idea.create('Web and large').addTag(webTag).addTag(largeTag)
      )

      await handler.handle({ tag: ['Web', 'Large'] })

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('Web and large')
      expect(fullOutput).not.toContain('Web only')
    })
  })

  describe('archive filter', () => {
    it('should show only active by default', async () => {
      await repository.save(Idea.create('Active idea'))
      await repository.save(Idea.create('Archived idea').archive())

      await handler.handle({})

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('Active idea')
      expect(fullOutput).not.toContain('Archived idea')
    })

    it('should show archived when --archived flag is set', async () => {
      await repository.save(Idea.create('Active idea'))
      await repository.save(Idea.create('Archived idea').archive())

      await handler.handle({ archived: true })

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('Archived idea')
      expect(fullOutput).not.toContain('Active idea')
    })

    it('should show all when --all flag is set', async () => {
      await repository.save(Idea.create('Active idea'))
      await repository.save(Idea.create('Archived idea').archive())

      await handler.handle({ all: true })

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('Active idea')
      expect(fullOutput).toContain('Archived idea')
    })
  })

  describe('display format', () => {
    it('should display tag count', async () => {
      const webTag = Tag.create('Web', TagCategory.domain())
      const idea = Idea.create('Tagged idea').addTag(webTag)
      await repository.save(idea)

      await handler.handle({})

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('1')
    })

    it('should display chunk count', async () => {
      const idea = Idea.create('Main idea').addChunk('Extra info')
      await repository.save(idea)

      await handler.handle({})

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('1')
    })

    it('should display total count', async () => {
      await repository.save(Idea.create('Idea 1'))
      await repository.save(Idea.create('Idea 2'))
      await repository.save(Idea.create('Idea 3'))

      await handler.handle({})

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('3')
    })
  })

  describe('error handling', () => {
    it('should display error for invalid limit', async () => {
      await handler.handle({ limit: -1 })

      const fullOutput = output.join('\n')
      expect(fullOutput).toContain('limit must be a positive integer')
    })
  })
})
