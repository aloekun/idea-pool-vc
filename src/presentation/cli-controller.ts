import { Command } from 'commander'
import type { IdeaCommandAPI } from '../application/api/idea-command-api.js'
import type { IdeaQueryAPI } from '../application/api/idea-query-api.js'
import type { IdeaAnalysisAPI } from '../application/api/idea-analysis-api.js'
import { AddIdeaRequest } from '../application/requests/add-idea-request.js'
import { AppendChunkRequest } from '../application/requests/append-chunk-request.js'
import { ListIdeasRequest } from '../application/requests/list-ideas-request.js'
import { ShowIdeaRequest } from '../application/requests/show-idea-request.js'
import { AnalyzeIdeaRequest } from '../application/requests/analyze-idea-request.js'
import { SuggestActionRequest } from '../application/requests/suggest-action-request.js'
import { AddTagRequest } from '../application/requests/add-tag-request.js'
import { RemoveTagRequest } from '../application/requests/remove-tag-request.js'
import { ArchiveIdeaRequest } from '../application/requests/archive-idea-request.js'
import { RestoreIdeaRequest } from '../application/requests/restore-idea-request.js'
import { ValidationError } from '../domain/index.js'

export class CLIController {
  private readonly program: Command

  constructor(
    private readonly commandAPI: IdeaCommandAPI,
    private readonly queryAPI: IdeaQueryAPI,
    private readonly analysisAPI: IdeaAnalysisAPI,
    private readonly defaultLimit: number = 10
  ) {
    this.program = this.createProgram()
  }

  private createProgram(): Command {
    const program = new Command()
    program
      .name('idea')
      .description('idea-pool-vc: Idea management CLI with LLM-powered analysis')
      .version('1.0.0')

    program.configureOutput({
      writeOut: (str: string) => process.stdout.write(str),
      writeErr: (str: string) => process.stderr.write(str),
    })

    this.registerAddCommand(program)
    this.registerAppendCommand(program)
    this.registerListCommand(program)
    this.registerShowCommand(program)
    this.registerAnalyzeCommand(program)
    this.registerSuggestCommand(program)
    this.registerTagCommand(program)
    this.registerArchiveCommand(program)
    this.registerRestoreCommand(program)

    return program
  }

  private registerAddCommand(program: Command): void {
    program
      .command('add')
      .description('Register a new idea')
      .argument('<text>', 'idea content')
      .action(async (text: string) => {
        await this.handleAdd(text)
      })
  }

  private registerAppendCommand(program: Command): void {
    program
      .command('append')
      .description('Append a chunk to an existing idea')
      .argument('<id>', 'idea ID')
      .argument('<text>', 'chunk content')
      .action(async (id: string, text: string) => {
        await this.handleAppend(id, text)
      })
  }

  private registerListCommand(program: Command): void {
    program
      .command('list')
      .description('List ideas')
      .option('--limit <n>', 'number of ideas to show', String(this.defaultLimit))
      .option('--tag <tag>', 'filter by tag (can be repeated)', this.collectTags, [])
      .option('--archived', 'show only archived ideas')
      .option('--all', 'show all ideas including archived')
      .action(async (options: {
        limit: string
        tag: string[]
        archived?: boolean
        all?: boolean
      }) => {
        await this.handleList(options)
      })
  }

  private registerShowCommand(program: Command): void {
    program
      .command('show')
      .description('Show idea details')
      .argument('<id>', 'idea ID')
      .action(async (id: string) => {
        await this.handleShow(id)
      })
  }

  private registerAnalyzeCommand(program: Command): void {
    program
      .command('analyze')
      .description('Analyze an idea with LLM to generate tags')
      .argument('<id>', 'idea ID')
      .action(async (id: string) => {
        await this.handleAnalyze(id)
      })
  }

  private registerSuggestCommand(program: Command): void {
    program
      .command('suggest')
      .description('Generate action suggestions for an idea')
      .argument('<id>', 'idea ID')
      .option('--analysis-id <aid>', 'specify analysis ID to use')
      .action(async (id: string, options: { analysisId?: string }) => {
        await this.handleSuggest(id, options.analysisId)
      })
  }

  private registerTagCommand(program: Command): void {
    const tagCmd = program
      .command('tag')
      .description('Manage tags')

    tagCmd
      .command('add')
      .description('Add a tag to an idea')
      .argument('<id>', 'idea ID')
      .argument('<name>', 'tag name')
      .requiredOption('--category <category>', 'tag category (NATURE, SCALE, DIFFICULTY, PHASE, RISK, DOMAIN)')
      .action(async (id: string, name: string, options: { category: string }) => {
        await this.handleAddTag(id, name, options.category)
      })

    tagCmd
      .command('remove')
      .description('Remove a tag from an idea')
      .argument('<id>', 'idea ID')
      .argument('<name>', 'tag name')
      .action(async (id: string, name: string) => {
        await this.handleRemoveTag(id, name)
      })
  }

  private registerArchiveCommand(program: Command): void {
    program
      .command('archive')
      .description('Archive an idea')
      .argument('<id>', 'idea ID')
      .action(async (id: string) => {
        await this.handleArchive(id)
      })
  }

  private registerRestoreCommand(program: Command): void {
    program
      .command('restore')
      .description('Restore an archived idea')
      .argument('<id>', 'idea ID')
      .action(async (id: string) => {
        await this.handleRestore(id)
      })
  }

  private collectTags(value: string, previous: string[]): string[] {
    return [...previous, value]
  }

  async run(argv: string[]): Promise<void> {
    try {
      await this.program.parseAsync(argv)
    } catch (error) {
      if (error instanceof ValidationError) {
        this.printError(error.message)
      } else {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred'
        this.printError(message)
        process.exitCode = 1
      }
    }
  }

  private async handleAdd(text: string): Promise<void> {
    try {
      const request = new AddIdeaRequest(text)
      const response = await this.commandAPI.addIdea(request)

      if (response.success) {
        this.printLine(`Idea added (ID: ${response.data.ideaId})`)
        this.printLine(`  Content: ${response.data.content}`)
        this.printLine(`  Created: ${response.data.createdAt}`)
      } else {
        this.printError(response.error.message)
      }
    } catch (error) {
      this.handleValidationError(error)
    }
  }

  private async handleAppend(id: string, text: string): Promise<void> {
    try {
      const request = new AppendChunkRequest(id, text)
      const response = await this.commandAPI.appendChunk(request)

      if (response.success) {
        this.printLine(`Chunk appended (ID: ${response.data.chunkId})`)
        this.printLine(`  Content: ${response.data.content}`)
        this.printLine(`  Created: ${response.data.createdAt}`)
      } else {
        this.printError(response.error.message)
      }
    } catch (error) {
      this.handleValidationError(error)
    }
  }

  private async handleList(options: {
    limit: string
    tag: string[]
    archived?: boolean
    all?: boolean
  }): Promise<void> {
    try {
      const limit = parseInt(options.limit, 10)
      const request = new ListIdeasRequest({
        limit: isNaN(limit) ? this.defaultLimit : limit,
        tags: options.tag,
        archivedOnly: options.archived ?? false,
        includeArchived: options.all ?? false,
      })
      const response = await this.queryAPI.listIdeas(request)

      if (response.success) {
        const { ideas, total } = response.data
        this.printLine(`Ideas (${total} items)`)
        this.printLine('')

        if (ideas.length === 0) {
          this.printLine('  No ideas found.')
          return
        }

        for (const idea of ideas) {
          this.printLine(`[${idea.id}] ${idea.content}`)
          const parts = [
            `Created: ${idea.createdAt}`,
            `Tags: ${idea.tagCount}`,
            `Chunks: ${idea.chunkCount}`,
            ...(idea.hasAnalysis ? ['Analyzed'] : []),
            ...(idea.archivedAt ? ['Archived'] : []),
          ]
          this.printLine(`  ${parts.join(' | ')}`)
          this.printLine('')
        }
      } else {
        this.printError(response.error.message)
      }
    } catch (error) {
      this.handleValidationError(error)
    }
  }

  private async handleShow(id: string): Promise<void> {
    try {
      const request = new ShowIdeaRequest(id)
      const response = await this.queryAPI.showIdea(request)

      if (response.success) {
        const idea = response.data
        this.printLine(`Idea: ${idea.id}`)
        this.printLine(`Content: ${idea.content}`)
        this.printLine(`Created: ${idea.createdAt}`)

        if (idea.archivedAt) {
          this.printLine(`Archived: ${idea.archivedAt}`)
        }

        if (idea.tags.length > 0) {
          this.printLine('')
          this.printLine('Tags:')
          for (const tag of idea.tags) {
            this.printLine(`  - ${tag.name} [${tag.category}]`)
          }
        }

        if (idea.chunks.length > 0) {
          this.printLine('')
          this.printLine('Chunks:')
          for (const chunk of idea.chunks) {
            this.printLine(`  [${chunk.createdAt}] ${chunk.content}`)
          }
        }

        if (idea.analyses.length > 0) {
          this.printLine('')
          this.printLine('Analyses:')
          for (const analysis of idea.analyses) {
            this.printLine(`  Analysis: ${analysis.id} (${analysis.createdAt})`)
            if (analysis.generatedTags.length > 0) {
              this.printLine(`    Tags: ${analysis.generatedTags.map((t) => `${t.name}[${t.category}]`).join(', ')}`)
            }
            if (analysis.suggestion) {
              this.printLine(`    Suggestion: ${analysis.suggestion.content}`)
              this.printLine(`    Reasoning: ${analysis.suggestion.reasoning}`)
            }
          }
        }
      } else {
        this.printError(response.error.message)
      }
    } catch (error) {
      this.handleValidationError(error)
    }
  }

  private async handleAnalyze(id: string): Promise<void> {
    try {
      const request = new AnalyzeIdeaRequest(id)
      this.printLine('Analyzing...')
      const response = await this.analysisAPI.analyzeIdea(request)

      if (response.success) {
        this.printLine(`Analysis completed (ID: ${response.data.analysisId})`)
        this.printLine('Generated tags:')
        for (const tag of response.data.generatedTags) {
          this.printLine(`  - ${tag.name} [${tag.category}]`)
        }
      } else {
        this.printError(response.error.message)
      }
    } catch (error) {
      this.handleValidationError(error)
    }
  }

  private async handleSuggest(id: string, analysisId?: string): Promise<void> {
    try {
      const request = new SuggestActionRequest(id, analysisId)
      this.printLine('Generating suggestion...')
      const response = await this.analysisAPI.suggestAction(request)

      if (response.success) {
        this.printLine('Suggestion generated')
        this.printLine('')
        this.printLine(`Used analysis: ${response.data.usedAnalysisId}`)
        this.printLine(`Suggestion: ${response.data.suggestion.content}`)
        this.printLine(`Reasoning: ${response.data.suggestion.reasoning}`)
      } else {
        this.printError(response.error.message)
      }
    } catch (error) {
      this.handleValidationError(error)
    }
  }

  private async handleAddTag(id: string, name: string, category: string): Promise<void> {
    try {
      const request = new AddTagRequest(id, name, category)
      const response = await this.commandAPI.addTag(request)

      if (response.success) {
        this.printLine(`Tag added: ${response.data.tag.name} [${response.data.tag.category}]`)
      } else {
        this.printError(response.error.message)
      }
    } catch (error) {
      this.handleValidationError(error)
    }
  }

  private async handleRemoveTag(id: string, name: string): Promise<void> {
    try {
      const request = new RemoveTagRequest(id, name)
      const response = await this.commandAPI.removeTag(request)

      if (response.success) {
        this.printLine(`Tag removed: ${response.data.removedTagName}`)
      } else {
        this.printError(response.error.message)
      }
    } catch (error) {
      this.handleValidationError(error)
    }
  }

  private async handleArchive(id: string): Promise<void> {
    try {
      const request = new ArchiveIdeaRequest(id)
      const response = await this.commandAPI.archiveIdea(request)

      if (response.success) {
        this.printLine(`Idea archived: ${response.data.ideaId}`)
        this.printLine(`  Archived at: ${response.data.archivedAt}`)
      } else {
        this.printError(response.error.message)
      }
    } catch (error) {
      this.handleValidationError(error)
    }
  }

  private async handleRestore(id: string): Promise<void> {
    try {
      const request = new RestoreIdeaRequest(id)
      const response = await this.commandAPI.restoreIdea(request)

      if (response.success) {
        this.printLine(`Idea restored: ${response.data.ideaId}`)
      } else {
        this.printError(response.error.message)
      }
    } catch (error) {
      this.handleValidationError(error)
    }
  }

  private handleValidationError(error: unknown): void {
    if (error instanceof ValidationError) {
      this.printError(error.message)
    } else {
      this.printError('An unexpected error occurred')
    }
  }

  private printLine(message: string): void {
    process.stdout.write(message + '\n')
  }

  private printError(message: string): void {
    process.stderr.write(`Error: ${message}\n`)
  }
}
