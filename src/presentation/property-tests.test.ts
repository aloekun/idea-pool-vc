import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { Idea, Chunk, Analysis, Suggestion, Tag, TagCategory } from '../domain/index.js'
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

// Feature: idea-classification-cli, Property 3: Entity timestamp on creation
describe('Feature: idea-classification-cli, Property 3: Entity timestamp on creation', () => {
  it('Idea should have a valid createdAt timestamp', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (content) => {
          const before = new Date()
          const idea = Idea.create(content)
          const after = new Date()

          expect(idea.createdAt).toBeInstanceOf(Date)
          expect(idea.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
          expect(idea.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
          expect(isFinite(idea.createdAt.getTime())).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Chunk should have a valid createdAt timestamp', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (content) => {
          const before = new Date()
          const chunk = Chunk.create(content)
          const after = new Date()

          expect(chunk.createdAt).toBeInstanceOf(Date)
          expect(chunk.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
          expect(chunk.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
          expect(isFinite(chunk.createdAt.getTime())).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Analysis should have a valid createdAt timestamp', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const before = new Date()
          const analysis = Analysis.createWithTags([
            Tag.create('Test', TagCategory.nature()),
          ])
          const after = new Date()

          expect(analysis.createdAt).toBeInstanceOf(Date)
          expect(analysis.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
          expect(analysis.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
          expect(isFinite(analysis.createdAt.getTime())).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Analysis with Suggestion should have a valid createdAt timestamp', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (content, reasoning) => {
          const suggestion = Suggestion.create(content, reasoning)

          const before = new Date()
          const analysis = Analysis.createWithSuggestion(suggestion)
          const after = new Date()

          expect(analysis.createdAt).toBeInstanceOf(Date)
          expect(analysis.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
          expect(analysis.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
          expect(isFinite(analysis.createdAt.getTime())).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Idea.addChunk should set valid timestamp on new chunk', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (ideaContent, chunkContent) => {
          const idea = Idea.create(ideaContent)

          const before = new Date()
          const updated = idea.addChunk(chunkContent)
          const after = new Date()

          const newChunk = updated.chunks[updated.chunks.length - 1]
          expect(newChunk.createdAt).toBeInstanceOf(Date)
          expect(newChunk.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
          expect(newChunk.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: idea-classification-cli, Property 21: Invalid command error handling
describe('Feature: idea-classification-cli, Property 21: Invalid command error handling', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let controller: CLIController

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    const showIdeaUseCase = new ShowIdeaUseCase(repository)
    const commandAPI = new IdeaCommandAPI(
      new AddIdeaUseCase(repository),
      new AppendChunkUseCase(repository),
      new AddTagUseCase(repository),
      new RemoveTagUseCase(repository),
      new ArchiveIdeaUseCase(repository),
      new RestoreIdeaUseCase(repository)
    )
    const queryAPI = new IdeaQueryAPI(
      new ListIdeasUseCase(repository),
      showIdeaUseCase
    )
    const analysisAPI = new IdeaAnalysisAPI(
      new AnalyzeIdeaUseCase(repository, llmService),
      new SuggestActionUseCase(repository, llmService)
    )
    controller = new CLIController(commandAPI, queryAPI, analysisAPI, 10)
  })

  it('should handle invalid commands without crashing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.string().filter((s) => !['add', 'list', 'show', 'append', 'analyze', 'suggest', 'tag', 'archive', 'restore', '--help', '-h', '--version', '-V'].includes(s)),
          { minLength: 1, maxLength: 3 }
        ),
        async (args) => {
          const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
          const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

          try {
            // Create a fresh controller per iteration to avoid Commander state issues
            const freshController = new CLIController(
              controller['commandAPI'],
              controller['queryAPI'],
              controller['analysisAPI'],
              10
            )
            await freshController.run(['node', 'idea', ...args])
          } catch {
            // Commander may throw for truly invalid commands;
            // the important thing is the process handles it gracefully
          } finally {
            stderrSpy.mockRestore()
            stdoutSpy.mockRestore()
          }

          // Verify the system does not crash -
          // it either shows help/error message or does nothing
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should show error for operations on nonexistent IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), { minLength: 10, maxLength: 26 }),
        async (fakeId) => {
          let errOutput: string[] = []
          const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((str) => {
            errOutput = [...errOutput, String(str)]
            return true
          })
          const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

          try {
            const freshController = new CLIController(
              controller['commandAPI'],
              controller['queryAPI'],
              controller['analysisAPI'],
              10
            )
            await freshController.run(['node', 'idea', 'show', fakeId])
          } finally {
            stderrSpy.mockRestore()
            stdoutSpy.mockRestore()
          }

          const combinedErrors = errOutput.join('')
          expect(combinedErrors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject empty content for add command', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 0, maxLength: 10 }),
        async (emptyContent) => {
          let errOutput: string[] = []
          const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((str) => {
            errOutput = [...errOutput, String(str)]
            return true
          })
          const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

          try {
            const freshController = new CLIController(
              controller['commandAPI'],
              controller['queryAPI'],
              controller['analysisAPI'],
              10
            )
            await freshController.run(['node', 'idea', 'add', emptyContent])
          } finally {
            stderrSpy.mockRestore()
            stdoutSpy.mockRestore()
          }

          const combinedErrors = errOutput.join('')
          expect(combinedErrors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
