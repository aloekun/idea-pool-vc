import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { handleAnalyzeCommand } from './handle-analyze-command.js'
import { IdeaAnalysisAPI } from '../../application/api/idea-analysis-api.js'
import { AnalyzeIdeaUseCase } from '../../application/use-cases/analyze-idea-use-case.js'
import { SuggestActionUseCase } from '../../application/use-cases/suggest-action-use-case.js'
import { MockIdeaRepository, MockLLMService } from '../../infrastructure/testing/index.js'
import { Idea, Tag, TagCategory } from '../../domain/index.js'
import type { Logger } from '../logger.js'

function createTestLogger(): Logger & { output: string[]; errors: string[] } {
  let output: string[] = []
  let errors: string[] = []
  return {
    get output() { return output },
    get errors() { return errors },
    log: (message: string) => { output = [...output, message] },
    error: (message: string) => { errors = [...errors, message] },
  }
}

describe('handleAnalyzeCommand', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let api: IdeaAnalysisAPI
  let logger: ReturnType<typeof createTestLogger>

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    const analyzeUseCase = new AnalyzeIdeaUseCase(repository, llmService)
    const suggestUseCase = new SuggestActionUseCase(repository, llmService)
    api = new IdeaAnalysisAPI(analyzeUseCase, suggestUseCase)
    logger = createTestLogger()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should display analysis results on success', async () => {
    const customTags = [
      Tag.create('Web', TagCategory.domain()),
      Tag.create('Medium', TagCategory.scale()),
    ]
    llmService.setOptions({ customTags })

    const idea = Idea.create('Build a REST API')
    await repository.save(idea)

    await handleAnalyzeCommand(api, idea.id.value, logger)

    const output = logger.output.join('\n')
    expect(output).toContain('Web')
    expect(output).toContain('Medium')
    expect(logger.errors.length).toBe(0)
  })

  it('should display error message for non-existent idea', async () => {
    await handleAnalyzeCommand(api, '01ARZ3NDEKTSV4RRFFQ69G5FAV', logger)

    expect(logger.errors.length).toBeGreaterThan(0)
    const errorOutput = logger.errors.join('\n')
    expect(errorOutput).toMatch(/not found|error/i)
  })

  it('should display error message when ideaId is empty', async () => {
    await handleAnalyzeCommand(api, '', logger)

    expect(logger.errors.length).toBeGreaterThan(0)
  })

  it('should display error when LLM service fails', async () => {
    llmService.setShouldFail(true)

    const idea = Idea.create('Test idea')
    await repository.save(idea)

    await handleAnalyzeCommand(api, idea.id.value, logger)

    expect(logger.errors.length).toBeGreaterThan(0)
    const errorOutput = logger.errors.join('\n')
    expect(errorOutput).toMatch(/LLM|error/i)
  })

  it('should display analysis ID on success', async () => {
    const idea = Idea.create('Build a REST API')
    await repository.save(idea)

    await handleAnalyzeCommand(api, idea.id.value, logger)

    const output = logger.output.join('\n')
    expect(output.length).toBeGreaterThan(0)
  })
})
