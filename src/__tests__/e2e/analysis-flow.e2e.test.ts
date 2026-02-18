import { describe, it, expect, afterEach } from 'vitest'
import {
  createE2ETestContext,
  extractIdeaId,
  extractAnalysisId,
  runCommand,
  type E2ETestContext,
} from './e2e-test-helper.js'

describe('E2E: Analysis Flow', () => {
  let ctx: E2ETestContext

  afterEach(() => {
    ctx?.cleanup()
  })

  describe('idea add -> idea analyze -> idea suggest', () => {
    it('should add an idea, analyze it for tags, then generate suggestions', async () => {
      ctx = createE2ETestContext()

      // Step 1: Add an idea
      await runCommand(ctx.controller, 'add', 'Build a real-time collaboration tool')
      const ideaId = extractIdeaId(ctx.getOutput())

      // Step 2: Analyze the idea (generates tags via MockLLMService)
      ctx.clearOutput()
      await runCommand(ctx.controller, 'analyze', ideaId)
      const analyzeOutput = ctx.getOutput()
      expect(analyzeOutput).toContain('Analyzing...')
      expect(analyzeOutput).toContain('Analysis completed')
      expect(analyzeOutput).toContain('Generated tags:')
      // MockLLMService returns these default tags
      expect(analyzeOutput).toContain('Web [DOMAIN]')
      expect(analyzeOutput).toContain('Medium [SCALE]')
      expect(analyzeOutput).toContain('Normal [DIFFICULTY]')
      expect(analyzeOutput).toContain('Concept [PHASE]')
      expect(analyzeOutput).toContain('Low [RISK]')
      expect(analyzeOutput).toContain('New [NATURE]')

      const analysisId = extractAnalysisId(analyzeOutput)
      expect(analysisId).toBeTruthy()

      // Step 3: Generate suggestions
      ctx.clearOutput()
      await runCommand(ctx.controller, 'suggest', ideaId)
      const suggestOutput = ctx.getOutput()
      expect(suggestOutput).toContain('Generating suggestion...')
      expect(suggestOutput).toContain('Suggestion generated')
      expect(suggestOutput).toContain('Used analysis:')
      expect(suggestOutput).toContain('Suggestion:')
      expect(suggestOutput).toContain('Reasoning:')
      // MockLLMService default suggestion
      expect(suggestOutput).toContain('proof of concept')
      expect(suggestOutput).toContain('minimizes initial investment')

      // Step 4: Verify the idea now shows analysis in details
      ctx.clearOutput()
      await runCommand(ctx.controller, 'show', ideaId)
      const showOutput = ctx.getOutput()
      expect(showOutput).toContain('Analyses:')
      expect(showOutput).toContain('Suggestion:')
      expect(showOutput).toContain('Reasoning:')
    })

    it('should perform analysis on idea with appended chunks', async () => {
      ctx = createE2ETestContext()

      // Add idea with chunks
      await runCommand(ctx.controller, 'add', 'E-commerce platform')
      const ideaId = extractIdeaId(ctx.getOutput())

      await runCommand(ctx.controller, 'append', ideaId, 'Need payment integration')
      await runCommand(ctx.controller, 'append', ideaId, 'Support multiple currencies')

      // Analyze
      ctx.clearOutput()
      await runCommand(ctx.controller, 'analyze', ideaId)
      const analyzeOutput = ctx.getOutput()
      expect(analyzeOutput).toContain('Analysis completed')

      // Verify LLM received the chunks
      const lastArgs = ctx.llmService.getLastGenerateTagsArgs()
      if (lastArgs === null) {
        expect.fail('Expected generateTags to have been called')
      }
      expect(lastArgs.ideaContent).toBe('E-commerce platform')
      expect(lastArgs.chunks).toHaveLength(2)
    })

    it('should handle analysis ID-specified suggestion', async () => {
      ctx = createE2ETestContext()

      // Add and analyze
      await runCommand(ctx.controller, 'add', 'Machine learning pipeline')
      const ideaId = extractIdeaId(ctx.getOutput())

      ctx.clearOutput()
      await runCommand(ctx.controller, 'analyze', ideaId)
      const firstAnalysisId = extractAnalysisId(ctx.getOutput())

      // Analyze again to have multiple analyses
      ctx.clearOutput()
      await runCommand(ctx.controller, 'analyze', ideaId)
      const secondAnalysisId = extractAnalysisId(ctx.getOutput())

      expect(firstAnalysisId).not.toBe(secondAnalysisId)

      // Suggest with specific analysis ID
      ctx.clearOutput()
      await runCommand(ctx.controller, 'suggest', ideaId, '--analysis-id', firstAnalysisId)
      const suggestOutput = ctx.getOutput()
      expect(suggestOutput).toContain('Suggestion generated')
      expect(suggestOutput).toContain(`Used analysis: ${firstAnalysisId}`)
    })

    it('should show error when analyzing nonexistent idea', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'analyze', '01NONEXISTENT000000000000')
      const errors = ctx.getErrors()
      expect(errors).toContain('Error:')
    })

    it('should show error when suggesting for idea without analysis', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'add', 'Unanalyzed idea')
      const ideaId = extractIdeaId(ctx.getOutput())

      ctx.clearErrors()
      await runCommand(ctx.controller, 'suggest', ideaId)
      const errors = ctx.getErrors()
      expect(errors).toContain('Error:')
    })

    it('should handle LLM service failure gracefully', async () => {
      ctx = createE2ETestContext({
        shouldFail: true,
        failMessage: 'LLM connection timeout',
      })

      await runCommand(ctx.controller, 'add', 'Test idea')
      const ideaId = extractIdeaId(ctx.getOutput())

      ctx.clearErrors()
      await runCommand(ctx.controller, 'analyze', ideaId)
      const errors = ctx.getErrors()
      expect(errors).toContain('Error:')
    })

    it('should show analysis with tags in idea details after analysis', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'add', 'Data visualization dashboard')
      const ideaId = extractIdeaId(ctx.getOutput())

      await runCommand(ctx.controller, 'analyze', ideaId)

      ctx.clearOutput()
      await runCommand(ctx.controller, 'show', ideaId)
      const showOutput = ctx.getOutput()
      expect(showOutput).toContain('Analyses:')
      expect(showOutput).toContain('Tags:')
      expect(showOutput).toContain('Web[DOMAIN]')
      expect(showOutput).toContain('Medium[SCALE]')
    })
  })
})
