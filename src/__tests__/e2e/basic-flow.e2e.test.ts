import { describe, it, expect, afterEach } from 'vitest'
import {
  createE2ETestContext,
  extractIdeaId,
  runCommand,
  type E2ETestContext,
} from './e2e-test-helper.js'

describe('E2E: Basic Flow', () => {
  let ctx: E2ETestContext

  afterEach(() => {
    ctx?.cleanup()
  })

  describe('idea add -> idea list -> idea show', () => {
    it('should add an idea, list it, then show its details', async () => {
      ctx = createE2ETestContext()

      // Step 1: Add an idea
      await runCommand(ctx.controller, 'add', 'Build a task management CLI tool')
      const addOutput = ctx.getOutput()
      expect(addOutput).toContain('Idea added')
      expect(addOutput).toContain('Build a task management CLI tool')
      expect(addOutput).toContain('Created:')

      const ideaId = extractIdeaId(addOutput)
      expect(ideaId).toBeTruthy()

      // Step 2: List ideas and verify the added idea appears
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list')
      const listOutput = ctx.getOutput()
      expect(listOutput).toContain('Ideas (1 items)')
      expect(listOutput).toContain(ideaId)
      expect(listOutput).toContain('Build a task management CLI tool')
      expect(listOutput).toContain('Tags: 0')
      expect(listOutput).toContain('Chunks: 0')

      // Step 3: Show idea details
      ctx.clearOutput()
      await runCommand(ctx.controller, 'show', ideaId)
      const showOutput = ctx.getOutput()
      expect(showOutput).toContain(`Idea: ${ideaId}`)
      expect(showOutput).toContain('Content: Build a task management CLI tool')
      expect(showOutput).toContain('Created:')
      // Should not show tags, chunks, or analyses sections when empty
      expect(showOutput).not.toContain('Tags:')
      expect(showOutput).not.toContain('Chunks:')
      expect(showOutput).not.toContain('Analyses:')
    })

    it('should add multiple ideas and list them all', async () => {
      ctx = createE2ETestContext()

      // Add multiple ideas
      await runCommand(ctx.controller, 'add', 'First idea')
      const firstId = extractIdeaId(ctx.getOutput())

      ctx.clearOutput()
      await runCommand(ctx.controller, 'add', 'Second idea')
      const secondId = extractIdeaId(ctx.getOutput())

      ctx.clearOutput()
      await runCommand(ctx.controller, 'add', 'Third idea')
      const thirdId = extractIdeaId(ctx.getOutput())

      // List ideas - should contain all three
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list')
      const listOutput = ctx.getOutput()
      expect(listOutput).toContain('Ideas (3 items)')
      expect(listOutput).toContain('First idea')
      expect(listOutput).toContain('Second idea')
      expect(listOutput).toContain('Third idea')
      expect(listOutput).toContain(firstId)
      expect(listOutput).toContain(secondId)
      expect(listOutput).toContain(thirdId)
    })

    it('should list ideas with --limit option', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'add', 'Idea A')
      await runCommand(ctx.controller, 'add', 'Idea B')
      await runCommand(ctx.controller, 'add', 'Idea C')

      ctx.clearOutput()
      await runCommand(ctx.controller, 'list', '--limit', '2')
      const listOutput = ctx.getOutput()
      expect(listOutput).toContain('Ideas (2 items)')
    })

    it('should show empty list when no ideas exist', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'list')
      const output = ctx.getOutput()
      expect(output).toContain('Ideas (0 items)')
      expect(output).toContain('No ideas found.')
    })

    it('should show error for nonexistent idea', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'show', '01NONEXISTENT000000000000')
      const errors = ctx.getErrors()
      expect(errors).toContain('Error:')
    })
  })

  describe('idea add -> idea append -> idea show', () => {
    it('should add an idea, append chunks, then show them in details', async () => {
      ctx = createE2ETestContext()

      // Step 1: Add an idea
      await runCommand(ctx.controller, 'add', 'Microservices architecture')
      const ideaId = extractIdeaId(ctx.getOutput())

      // Step 2: Append first chunk
      ctx.clearOutput()
      await runCommand(ctx.controller, 'append', ideaId, 'Need to consider service discovery')
      const appendOutput1 = ctx.getOutput()
      expect(appendOutput1).toContain('Chunk appended')
      expect(appendOutput1).toContain('Need to consider service discovery')
      expect(appendOutput1).toContain('Created:')

      // Step 3: Append second chunk
      ctx.clearOutput()
      await runCommand(ctx.controller, 'append', ideaId, 'API gateway pattern is essential')
      const appendOutput2 = ctx.getOutput()
      expect(appendOutput2).toContain('Chunk appended')
      expect(appendOutput2).toContain('API gateway pattern is essential')

      // Step 4: Show idea details with chunks
      ctx.clearOutput()
      await runCommand(ctx.controller, 'show', ideaId)
      const showOutput = ctx.getOutput()
      expect(showOutput).toContain('Content: Microservices architecture')
      expect(showOutput).toContain('Chunks:')
      expect(showOutput).toContain('Need to consider service discovery')
      expect(showOutput).toContain('API gateway pattern is essential')

      // Step 5: Verify in list that chunk count is updated
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list')
      const listOutput = ctx.getOutput()
      expect(listOutput).toContain('Chunks: 2')
    })

    it('should show error when appending to nonexistent idea', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'append', '01NONEXISTENT000000000000', 'Some chunk')
      const errors = ctx.getErrors()
      expect(errors).toContain('Error:')
    })

    it('should reject empty chunk content', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'add', 'Test idea')
      const ideaId = extractIdeaId(ctx.getOutput())

      ctx.clearErrors()
      await runCommand(ctx.controller, 'append', ideaId, '')
      const errors = ctx.getErrors()
      expect(errors).toContain('Error:')
    })
  })
})
