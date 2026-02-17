import { describe, it, expect, afterEach } from 'vitest'
import {
  createE2ETestContext,
  extractIdeaId,
  runCommand,
  type E2ETestContext,
} from './e2e-test-helper.js'

describe('E2E: Archive Flow', () => {
  let ctx: E2ETestContext

  afterEach(() => {
    ctx?.cleanup()
  })

  describe('idea add -> idea archive -> idea list -> idea list --archived -> idea restore -> idea list', () => {
    it('should archive an idea and exclude it from default list', async () => {
      ctx = createE2ETestContext()

      // Step 1: Add two ideas
      await runCommand(ctx.controller, 'add', 'Active idea')
      void extractIdeaId(ctx.getOutput())

      ctx.clearOutput()
      await runCommand(ctx.controller, 'add', 'Will be archived')
      const archiveId = extractIdeaId(ctx.getOutput())

      // Step 2: Verify both appear in list
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list')
      const listBefore = ctx.getOutput()
      expect(listBefore).toContain('Ideas (2 items)')
      expect(listBefore).toContain('Active idea')
      expect(listBefore).toContain('Will be archived')

      // Step 3: Archive one idea
      ctx.clearOutput()
      await runCommand(ctx.controller, 'archive', archiveId)
      const archiveOutput = ctx.getOutput()
      expect(archiveOutput).toContain(`Idea archived: ${archiveId}`)
      expect(archiveOutput).toContain('Archived at:')

      // Step 4: Default list should exclude archived
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list')
      const listAfterArchive = ctx.getOutput()
      expect(listAfterArchive).toContain('Ideas (1 items)')
      expect(listAfterArchive).toContain('Active idea')
      expect(listAfterArchive).not.toContain('Will be archived')

      // Step 5: --archived should show only archived
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list', '--archived')
      const archivedList = ctx.getOutput()
      expect(archivedList).toContain('Ideas (1 items)')
      expect(archivedList).toContain('Will be archived')
      expect(archivedList).not.toContain('Active idea')
      expect(archivedList).toContain('Archived')

      // Step 6: --all should show both
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list', '--all')
      const allList = ctx.getOutput()
      expect(allList).toContain('Ideas (2 items)')
      expect(allList).toContain('Active idea')
      expect(allList).toContain('Will be archived')

      // Step 7: Restore the archived idea
      ctx.clearOutput()
      await runCommand(ctx.controller, 'restore', archiveId)
      const restoreOutput = ctx.getOutput()
      expect(restoreOutput).toContain(`Idea restored: ${archiveId}`)

      // Step 8: Default list should show both again
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list')
      const listAfterRestore = ctx.getOutput()
      expect(listAfterRestore).toContain('Ideas (2 items)')
      expect(listAfterRestore).toContain('Active idea')
      expect(listAfterRestore).toContain('Will be archived')
    })

    it('should show archived status in idea details', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'add', 'Archivable idea')
      const ideaId = extractIdeaId(ctx.getOutput())

      // Show before archiving - should not show archived status
      ctx.clearOutput()
      await runCommand(ctx.controller, 'show', ideaId)
      const showBefore = ctx.getOutput()
      expect(showBefore).not.toContain('Archived:')

      // Archive
      await runCommand(ctx.controller, 'archive', ideaId)

      // Show after archiving - should show archived status
      ctx.clearOutput()
      await runCommand(ctx.controller, 'show', ideaId)
      const showAfter = ctx.getOutput()
      expect(showAfter).toContain('Archived:')

      // Restore
      await runCommand(ctx.controller, 'restore', ideaId)

      // Show after restoring - should not show archived status
      ctx.clearOutput()
      await runCommand(ctx.controller, 'show', ideaId)
      const showRestored = ctx.getOutput()
      expect(showRestored).not.toContain('Archived:')
    })

    it('should show empty list when all ideas are archived', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'add', 'Only idea')
      const ideaId = extractIdeaId(ctx.getOutput())

      await runCommand(ctx.controller, 'archive', ideaId)

      ctx.clearOutput()
      await runCommand(ctx.controller, 'list')
      const output = ctx.getOutput()
      expect(output).toContain('Ideas (0 items)')
      expect(output).toContain('No ideas found.')
    })

    it('should archive multiple ideas independently', async () => {
      ctx = createE2ETestContext()

      // Add 3 ideas
      await runCommand(ctx.controller, 'add', 'Idea One')
      const id1 = extractIdeaId(ctx.getOutput())

      ctx.clearOutput()
      await runCommand(ctx.controller, 'add', 'Idea Two')
      const id2 = extractIdeaId(ctx.getOutput())

      ctx.clearOutput()
      await runCommand(ctx.controller, 'add', 'Idea Three')

      // Archive first two
      await runCommand(ctx.controller, 'archive', id1)
      await runCommand(ctx.controller, 'archive', id2)

      // Only third should show in default list
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list')
      const defaultList = ctx.getOutput()
      expect(defaultList).toContain('Ideas (1 items)')
      expect(defaultList).toContain('Idea Three')
      expect(defaultList).not.toContain('Idea One')
      expect(defaultList).not.toContain('Idea Two')

      // Archived list should show first two
      ctx.clearOutput()
      await runCommand(ctx.controller, 'list', '--archived')
      const archivedList = ctx.getOutput()
      expect(archivedList).toContain('Ideas (2 items)')
      expect(archivedList).toContain('Idea One')
      expect(archivedList).toContain('Idea Two')
      expect(archivedList).not.toContain('Idea Three')
    })

    it('should show error when archiving nonexistent idea', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'archive', '01NONEXISTENT000000000000')
      const errors = ctx.getErrors()
      expect(errors).toContain('Error:')
    })

    it('should show error when restoring nonexistent idea', async () => {
      ctx = createE2ETestContext()

      await runCommand(ctx.controller, 'restore', '01NONEXISTENT000000000000')
      const errors = ctx.getErrors()
      expect(errors).toContain('Error:')
    })

    it('should preserve tags and chunks after archive and restore', async () => {
      ctx = createE2ETestContext()

      // Add idea with tags and chunks
      await runCommand(ctx.controller, 'add', 'Full idea')
      const ideaId = extractIdeaId(ctx.getOutput())

      await runCommand(ctx.controller, 'append', ideaId, 'Important note')
      await runCommand(
        ctx.controller,
        'tag', 'add', ideaId, 'Priority', '--category', 'PHASE'
      )

      // Archive and restore
      await runCommand(ctx.controller, 'archive', ideaId)
      await runCommand(ctx.controller, 'restore', ideaId)

      // Verify data is preserved
      ctx.clearOutput()
      await runCommand(ctx.controller, 'show', ideaId)
      const showOutput = ctx.getOutput()
      expect(showOutput).toContain('Content: Full idea')
      expect(showOutput).toContain('Chunks:')
      expect(showOutput).toContain('Important note')
      expect(showOutput).toContain('Tags:')
      expect(showOutput).toContain('Priority [PHASE]')
      expect(showOutput).not.toContain('Archived:')
    })
  })
})
