import type { IdeaQueryAPI } from '../../application/api/idea-query-api.js'
import { ListIdeasRequest } from '../../application/query/list-ideas-request.js'
import { ValidationError } from '../../domain/index.js'

export interface ListCommandOptions {
  readonly limit?: number
  readonly tag?: readonly string[]
  readonly archived?: boolean
  readonly all?: boolean
}

type OutputFn = (message: string) => void

export class ListCommandHandler {
  constructor(
    private readonly queryAPI: IdeaQueryAPI,
    private readonly write: OutputFn
  ) {}

  async handle(options: ListCommandOptions): Promise<void> {
    try {
      const request = new ListIdeasRequest({
        limit: options.limit,
        tags: options.tag,
        archived: options.archived,
        all: options.all,
      })

      const response = await this.queryAPI.listIdeas(request)

      if (response.success) {
        const { ideas, total } = response.data

        if (total === 0) {
          this.write('No ideas found. (0 results)')
          return
        }

        this.write(`Ideas (${total} results)`)
        this.write('')

        for (const idea of ideas) {
          this.write(`[${idea.id}] ${idea.content}`)
          const parts = [
            `Created: ${idea.createdAt}`,
            `Tags: ${idea.tagCount}`,
            `Chunks: ${idea.chunkCount}`,
          ]
          if (idea.hasAnalysis) {
            parts.push('Analyzed')
          }
          if (idea.archivedAt) {
            parts.push(`Archived: ${idea.archivedAt}`)
          }
          this.write(`  ${parts.join(' | ')}`)
          this.write('')
        }
      } else {
        this.write(`Error: ${response.error.message}`)
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        this.write(`Error: ${error.message}`)
      } else {
        this.write('Error: An unexpected error occurred')
      }
    }
  }
}
