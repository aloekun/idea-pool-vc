import { describe, it, expect, afterEach } from 'vitest'
import {
  createE2ETestContext,
  extractIdeaId,
  runCommand,
  type E2ETestContext,
} from './e2e-test-helper.js'

describe('E2E: Tag Management Flow', () => {
  let ctx: E2ETestContext

  afterEach(() => {
    ctx?.cleanup()
  })

  describe('idea add -> idea tag add -> idea show -> idea tag remove', () => {
    it('should add tags, verify in details, then remove them', async () => {
      ctx = createE2ETestContext()

      // Step 1: Add an idea
      await runCommand(ctx.controller, 'add', 'GraphQL API server')
      const ideaId = extractIdeaId(ctx.getOutput())

      // Step 2: Add a tag
      ctx.clearOutput()
      await runCommand(
        ctx.controller,
        'tag', 'add', ideaId, 'Backend', '--category', 'DOMAIN'
      )
      const addTagOutput = ctx.getOutput()
      expect(addTagOutput).toContain('Tag added: Backend [DOMAIN]')

      // Step 3: Add another tag
      ctx.clearOutput()
      await runCommand(
        ctx.controller,
        'tag', 'add', ideaId, 'Medium', '--category', 'SCALE'
      )
      const addTagOutput2 = ctx.getOutput()
      expect(addTagOutput2).toContain('Tag added: Medium [SCALE]')

      // Step 4: Show idea - verify tags are displayed
      ctx.clearOutput()
      await runCommand(ctx.controller, 'show', ideaId)
      const showOutput = ctx.getOutput()
      expect(showOutput).toContain('Content: GraphQL API server')
      expect(showOutput).toContain('Tags:')
      expect(showOutput).toContain('Backend [DOMAIN]')
      expect(showOutput).toContain('Medium [SCALE]')

      // Step 5: Verify tag count in list
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list')
      const listOutput = ctx.getOutput()
      expect(listOutput).toContain('Tags: 2')

      // Step 6: Remove a tag
      ctx.clearOutput()
      await runCommand(ctx.controller, 'tag', 'remove', ideaId, 'Backend')
      const removeOutput = ctx.getOutput()
      expect(removeOutput).toContain('Tag removed: Backend')

      // Step 7: Show idea - verify tag was removed
      ctx.clearOutput()
      await runCommand(ctx.controller, 'show', ideaId)
      const showAfterRemove = ctx.getOutput()
      expect(showAfterRemove).toContain('Tags:')
      expect(showAfterRemove).toContain('Medium [SCALE]')
      expect(showAfterRemove).not.toContain('Backend [DOMAIN]')

      // Step 8: Verify tag count decreased
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list')
      const listAfterRemove = ctx.getOutput()
      expect(listAfterRemove).toContain('Tags: 1')
    })

    it('should add tags with all valid categories', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'add', 'Full-stack web app')
      const ideaId = extractIdeaId(ctx.getOutput())

      const categories = [
        { name: 'WebApp', category: 'NATURE' },
        { name: 'Large', category: 'SCALE' },
        { name: 'Hard', category: 'DIFFICULTY' },
        { name: 'Development', category: 'PHASE' },
        { name: 'High', category: 'RISK' },
        { name: 'Finance', category: 'DOMAIN' },
      ]

      for (const { name, category } of categories) {
        ctx.clearOutput()
        await runCommand(
          ctx.controller,
          'tag', 'add', ideaId, name, '--category', category
        )
        const output = ctx.getOutput()
        expect(output).toContain(`Tag added: ${name} [${category}]`)
      }

      // Verify all tags are shown
      ctx.clearOutput()
      await runCommand(ctx.controller, 'show', ideaId)
      const showOutput = ctx.getOutput()
      expect(showOutput).toContain('Tags:')
      for (const { name, category } of categories) {
        expect(showOutput).toContain(`${name} [${category}]`)
      }

      // Verify tag count
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list')
      const listOutput = ctx.getOutput()
      expect(listOutput).toContain('Tags: 6')
    })

    it('should filter ideas by tag in list', async () => {
      ctx = createE2ETestContext()

      // Add two ideas with different tags
      await runCommand(ctx.controller, 'add', 'Web project')
      const webId = extractIdeaId(ctx.getOutput())

      ctx.clearOutput()
      await runCommand(ctx.controller, 'add', 'Mobile project')
      const mobileId = extractIdeaId(ctx.getOutput())

      await runCommand(
        ctx.controller,
        'tag', 'add', webId, 'Web', '--category', 'DOMAIN'
      )
      await runCommand(
        ctx.controller,
        'tag', 'add', mobileId, 'Mobile', '--category', 'DOMAIN'
      )

      // Filter by 'Web' tag
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list', '--tag', 'Web')
      const webList = ctx.getOutput()
      expect(webList).toContain('Web project')
      expect(webList).not.toContain('Mobile project')

      // Filter by 'Mobile' tag
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list', '--tag', 'Mobile')
      const mobileList = ctx.getOutput()
      expect(mobileList).toContain('Mobile project')
      expect(mobileList).not.toContain('Web project')
    })

    it('should show error when adding tag to nonexistent idea', async () => {
      ctx = createE2ETestContext()

      await runCommand(
        ctx.controller,
        'tag', 'add', '01NONEXISTENT000000000000', 'Test', '--category', 'DOMAIN'
      )
      const errors = ctx.getErrors()
      expect(errors).toContain('Error:')
    })

    it('should handle removing nonexistent tag gracefully (idempotent)', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'add', 'Test idea')
      const ideaId = extractIdeaId(ctx.getOutput())

      ctx.clearOutput()
      await runCommand(ctx.controller, 'tag', 'remove', ideaId, 'NonexistentTag')
      // RemoveTagUseCase treats removal of nonexistent tags as success (idempotent)
      const output = ctx.getOutput()
      expect(output).toContain('Tag removed: NonexistentTag')
    })

    it('should show error for invalid tag category', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'add', 'Test idea')
      const ideaId = extractIdeaId(ctx.getOutput())

      ctx.clearErrors()
      await runCommand(
        ctx.controller,
        'tag', 'add', ideaId, 'Test', '--category', 'INVALID_CATEGORY'
      )
      const errors = ctx.getErrors()
      expect(errors).toContain('Error:')
    })
  })
})
