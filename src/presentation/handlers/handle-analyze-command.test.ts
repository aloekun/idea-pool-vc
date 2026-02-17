import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleAnalyzeCommand } from './handle-analyze-command.js'
import { IdeaAnalysisAPI } from '../../application/api/idea-analysis-api.js'
import { AnalyzeIdeaUseCase } from '../../application/use-cases/analyze-idea-use-case.js'
import { SuggestActionUseCase } from '../../application/use-cases/suggest-action-use-case.js'
import { MockIdeaRepository, MockLLMService } from '../../infrastructure/testing/index.js'
import { Idea, Tag, TagCategory } from '../../domain/index.js'

describe('handleAnalyzeCommand', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let api: IdeaAnalysisAPI
  let consoleOutput: string[]
  let consoleErrors: string[]

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    const analyzeUseCase = new AnalyzeIdeaUseCase(repository, llmService)
    const suggestUseCase = new SuggestActionUseCase(repository, llmService)
    api = new IdeaAnalysisAPI(analyzeUseCase, suggestUseCase)

    consoleOutput = []
    consoleErrors = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      consoleOutput.push(args.join(' '))
    })
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      consoleErrors.push(args.join(' '))
    })
  })

  it('should display analysis results on success', async () => {
    const customTags = [
      Tag.create('Web', TagCategory.domain()),
      Tag.create('Medium', TagCategory.scale()),
    ]
    llmService.setOptions({ customTags })

    const idea = Idea.create('Build a REST API')
    await repository.save(idea)

    await handleAnalyzeCommand(api, idea.id.value)

    const output = consoleOutput.join('\n')
    expect(output).toContain('Web')
    expect(output).toContain('Medium')
    expect(consoleErrors.length).toBe(0)
  })

  it('should display error message for non-existent idea', async () => {
    await handleAnalyzeCommand(api, '01ARZ3NDEKTSV4RRFFQ69G5FAV')

    expect(consoleErrors.length).toBeGreaterThan(0)
    const errorOutput = consoleErrors.join('\n')
    expect(errorOutput).toMatch(/not found|error/i)
  })

  it('should display error message when ideaId is empty', async () => {
    await handleAnalyzeCommand(api, '')

    expect(consoleErrors.length).toBeGreaterThan(0)
  })

  it('should display error when LLM service fails', async () => {
    llmService.setShouldFail(true)

    const idea = Idea.create('Test idea')
    await repository.save(idea)

    await handleAnalyzeCommand(api, idea.id.value)

    expect(consoleErrors.length).toBeGreaterThan(0)
    const errorOutput = consoleErrors.join('\n')
    expect(errorOutput).toMatch(/LLM|error/i)
  })

  it('should display analysis ID on success', async () => {
    const idea = Idea.create('Build a REST API')
    await repository.save(idea)

    await handleAnalyzeCommand(api, idea.id.value)

    const output = consoleOutput.join('\n')
    // Analysis ID should be present in the output
    expect(output.length).toBeGreaterThan(0)
  })
})
