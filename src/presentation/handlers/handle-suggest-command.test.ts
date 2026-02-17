import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { handleSuggestCommand } from './handle-suggest-command.js'
import { IdeaAnalysisAPI } from '../../application/api/idea-analysis-api.js'
import { AnalyzeIdeaUseCase } from '../../application/use-cases/analyze-idea-use-case.js'
import { SuggestActionUseCase } from '../../application/use-cases/suggest-action-use-case.js'
import { MockIdeaRepository, MockLLMService } from '../../infrastructure/testing/index.js'
import { Idea, Analysis, Tag, TagCategory, Suggestion } from '../../domain/index.js'
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

describe('handleSuggestCommand', () => {
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

  function createIdeaWithAnalysis(): { idea: Idea; analysis: Analysis } {
    const tags = [
      Tag.create('Web', TagCategory.domain()),
      Tag.create('Medium', TagCategory.scale()),
    ]
    const analysis = Analysis.createWithTags(tags)
    let idea = Idea.create('Build a task management app')
    idea = idea.addAnalysis(analysis)
    return { idea, analysis }
  }

  describe('without analysisId', () => {
    it('should display suggestion on success', async () => {
      const customSuggestion = Suggestion.create(
        'Start with a minimal prototype focusing on core task management.',
        'This approach allows quick validation of the concept.'
      )
      llmService.setOptions({ customSuggestion })

      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      await handleSuggestCommand(api, idea.id.value, undefined, logger)

      const output = logger.output.join('\n')
      expect(output).toContain('Start with a minimal prototype')
      expect(output).toContain('quick validation')
      expect(logger.errors.length).toBe(0)
    })

    it('should display error for non-existent idea', async () => {
      await handleSuggestCommand(api, '01ARZ3NDEKTSV4RRFFQ69G5FAV', undefined, logger)

      expect(logger.errors.length).toBeGreaterThan(0)
    })

    it('should display error when idea has no analyses', async () => {
      const idea = Idea.create('Idea without analysis')
      await repository.save(idea)

      await handleSuggestCommand(api, idea.id.value, undefined, logger)

      expect(logger.errors.length).toBeGreaterThan(0)
    })

    it('should display error when LLM service fails', async () => {
      llmService.setShouldFail(true)

      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      await handleSuggestCommand(api, idea.id.value, undefined, logger)

      expect(logger.errors.length).toBeGreaterThan(0)
    })

    it('should display error when ideaId is empty', async () => {
      await handleSuggestCommand(api, '', undefined, logger)

      expect(logger.errors.length).toBeGreaterThan(0)
    })
  })

  describe('with analysisId', () => {
    it('should use specified analysis for suggestion', async () => {
      const tags1 = [Tag.create('Web', TagCategory.domain())]
      const analysis1 = Analysis.createWithTags(tags1)
      const tags2 = [Tag.create('Mobile', TagCategory.domain())]
      const analysis2 = Analysis.createWithTags(tags2)

      let idea = Idea.create('Multi-platform app')
      idea = idea.addAnalysis(analysis1)
      idea = idea.addAnalysis(analysis2)
      await repository.save(idea)

      await handleSuggestCommand(api, idea.id.value, analysis1.id.value, logger)

      const output = logger.output.join('\n')
      expect(output.length).toBeGreaterThan(0)
      expect(logger.errors.length).toBe(0)
    })

    it('should display error for non-existent analysisId', async () => {
      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      await handleSuggestCommand(
        api,
        idea.id.value,
        '01ARZ3NDEKTSV4RRFFQ69G5NONEXISTENT',
        logger
      )

      expect(logger.errors.length).toBeGreaterThan(0)
    })
  })

  describe('output format', () => {
    it('should display used analysis ID', async () => {
      const { idea, analysis } = createIdeaWithAnalysis()
      await repository.save(idea)

      await handleSuggestCommand(api, idea.id.value, undefined, logger)

      const output = logger.output.join('\n')
      expect(output).toContain(analysis.id.value)
    })

    it('should display suggestion content and reasoning', async () => {
      const customSuggestion = Suggestion.create(
        'Build a landing page first.',
        'Validates market interest before heavy development.'
      )
      llmService.setOptions({ customSuggestion })

      const { idea } = createIdeaWithAnalysis()
      await repository.save(idea)

      await handleSuggestCommand(api, idea.id.value, undefined, logger)

      const output = logger.output.join('\n')
      expect(output).toContain('Build a landing page first.')
      expect(output).toContain('Validates market interest')
    })
  })
})
