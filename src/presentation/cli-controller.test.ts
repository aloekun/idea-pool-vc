import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CLIController } from './cli-controller.js'
import { IdeaCommandAPI, IdeaQueryAPI, IdeaAnalysisAPI } from '../application/api/index.js'
import {
  AddIdeaUseCase,
  AppendChunkUseCase,
  AddTagUseCase,
  RemoveTagUseCase,
  ArchiveIdeaUseCase,
  RestoreIdeaUseCase,
  ShowIdeaUseCase,
  ListIdeasUseCase,
  AnalyzeIdeaUseCase,
  SuggestActionUseCase,
} from '../application/use-cases/index.js'
import { MockIdeaRepository } from '../infrastructure/testing/mock-idea-repository.js'
import { MockLLMService } from '../infrastructure/testing/mock-llm-service.js'

function createController(
  repository: MockIdeaRepository,
  llmService: MockLLMService
): CLIController {
  const showIdeaUseCase = new ShowIdeaUseCase(repository)
  const commandAPI = new IdeaCommandAPI(
    new AddIdeaUseCase(repository),
    new AppendChunkUseCase(repository),
    new AddTagUseCase(repository),
    new RemoveTagUseCase(repository),
    new ArchiveIdeaUseCase(repository),
    new RestoreIdeaUseCase(repository),
    showIdeaUseCase
  )
  const queryAPI = new IdeaQueryAPI(
    new ListIdeasUseCase(repository),
    showIdeaUseCase
  )
  const analysisAPI = new IdeaAnalysisAPI(
    new AnalyzeIdeaUseCase(repository, llmService),
    new SuggestActionUseCase(repository, llmService)
  )

  return new CLIController(commandAPI, queryAPI, analysisAPI, 10)
}

describe('CLIController', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let controller: CLIController
  let output: string[]
  let errors: string[]

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    controller = createController(repository, llmService)
    output = []
    errors = []
    vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
      output.push(String(str))
      return true
    })
    vi.spyOn(process.stderr, 'write').mockImplementation((str) => {
      errors.push(String(str))
      return true
    })
  })

  describe('add command', () => {
    it('should add an idea', async () => {
      await controller.run(['node', 'idea', 'add', 'My test idea'])
      const combinedOutput = output.join('')
      expect(combinedOutput).toContain('My test idea')
      expect(repository.count()).toBe(1)
    })

    it('should show error for empty content', async () => {
      await controller.run(['node', 'idea', 'add', ''])
      const combinedErrors = errors.join('')
      expect(combinedErrors.length).toBeGreaterThan(0)
    })
  })

  describe('list command', () => {
    it('should list ideas', async () => {
      await controller.run(['node', 'idea', 'add', 'Idea 1'])
      output = []
      await controller.run(['node', 'idea', 'list'])
      const combinedOutput = output.join('')
      expect(combinedOutput).toContain('Idea 1')
    })

    it('should respect --limit option', async () => {
      await controller.run(['node', 'idea', 'add', 'Idea 1'])
      await controller.run(['node', 'idea', 'add', 'Idea 2'])
      await controller.run(['node', 'idea', 'add', 'Idea 3'])
      output = []
      await controller.run(['node', 'idea', 'list', '--limit', '2'])
      const combinedOutput = output.join('')
      expect(combinedOutput).toBeTruthy()
    })
  })

  describe('show command', () => {
    it('should show idea details', async () => {
      await controller.run(['node', 'idea', 'add', 'Show this idea'])

      const ideas = repository.getAll()
      const ideaId = ideas[0].id.value

      output = []
      await controller.run(['node', 'idea', 'show', ideaId])
      const combinedOutput = output.join('')
      expect(combinedOutput).toContain('Show this idea')
    })

    it('should show error for nonexistent idea', async () => {
      await controller.run(['node', 'idea', 'show', 'nonexistent'])
      const combinedErrors = errors.join('')
      expect(combinedErrors.length).toBeGreaterThan(0)
    })
  })

  describe('append command', () => {
    it('should append chunk to idea', async () => {
      await controller.run(['node', 'idea', 'add', 'Base idea'])
      const ideas = repository.getAll()
      const ideaId = ideas[0].id.value

      output = []
      await controller.run(['node', 'idea', 'append', ideaId, 'Additional note'])
      const combinedOutput = output.join('')
      expect(combinedOutput).toContain('Additional note')

      const updatedIdea = await repository.findById(ideas[0].id)
      expect(updatedIdea!.chunks).toHaveLength(1)
    })
  })

  describe('analyze command', () => {
    it('should analyze an idea', async () => {
      await controller.run(['node', 'idea', 'add', 'Analyze this'])
      const ideas = repository.getAll()
      const ideaId = ideas[0].id.value

      output = []
      await controller.run(['node', 'idea', 'analyze', ideaId])
      const combinedOutput = output.join('')
      expect(combinedOutput).toBeTruthy()
    })
  })

  describe('suggest command', () => {
    it('should suggest action for analyzed idea', async () => {
      await controller.run(['node', 'idea', 'add', 'Suggest for this'])
      const ideas = repository.getAll()
      const ideaId = ideas[0].id.value

      await controller.run(['node', 'idea', 'analyze', ideaId])
      output = []
      await controller.run(['node', 'idea', 'suggest', ideaId])
      const combinedOutput = output.join('')
      expect(combinedOutput).toBeTruthy()
    })
  })

  describe('tag subcommands', () => {
    it('should add and remove tags', async () => {
      await controller.run(['node', 'idea', 'add', 'Tag this idea'])
      const ideas = repository.getAll()
      const ideaId = ideas[0].id.value

      output = []
      await controller.run(['node', 'idea', 'tag', 'add', ideaId, 'Web', '--category', 'DOMAIN'])
      let combinedOutput = output.join('')
      expect(combinedOutput).toContain('Web')

      output = []
      await controller.run(['node', 'idea', 'tag', 'remove', ideaId, 'Web'])
      combinedOutput = output.join('')
      expect(combinedOutput).toContain('Web')
    })
  })

  describe('archive and restore commands', () => {
    it('should archive and restore an idea', async () => {
      await controller.run(['node', 'idea', 'add', 'Archive me'])
      const ideas = repository.getAll()
      const ideaId = ideas[0].id.value

      output = []
      await controller.run(['node', 'idea', 'archive', ideaId])
      let combinedOutput = output.join('')
      expect(combinedOutput).toBeTruthy()

      const archivedIdea = await repository.findById(ideas[0].id)
      expect(archivedIdea!.isArchived()).toBe(true)

      output = []
      await controller.run(['node', 'idea', 'restore', ideaId])
      combinedOutput = output.join('')
      expect(combinedOutput).toBeTruthy()

      const restoredIdea = await repository.findById(ideas[0].id)
      expect(restoredIdea!.isArchived()).toBe(false)
    })
  })
})
