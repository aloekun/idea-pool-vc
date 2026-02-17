import type { IdeaQueryAPI } from '../../application/api/idea-query-api.js'
import { ShowIdeaRequest } from '../../application/query/show-idea-request.js'
import { ValidationError } from '../../domain/index.js'

type OutputFn = (message: string) => void

export class ShowCommandHandler {
  constructor(
    private readonly queryAPI: IdeaQueryAPI,
    private readonly write: OutputFn
  ) {}

  async handle(ideaId: string): Promise<void> {
    try {
      const request = new ShowIdeaRequest(ideaId)
      const response = await this.queryAPI.showIdea(request)

      if (response.success) {
        const detail = response.data

        this.write(`ID: ${detail.id}`)
        this.write(`Content: ${detail.content}`)
        this.write(`Created: ${detail.createdAt}`)

        if (detail.archivedAt) {
          this.write(`Archived: ${detail.archivedAt}`)
        }

        if (detail.chunks.length > 0) {
          this.write('')
          this.write(`Chunks (${detail.chunks.length}):`)
          for (const chunk of detail.chunks) {
            this.write(`  [${chunk.createdAt}] ${chunk.content}`)
          }
        }

        if (detail.tags.length > 0) {
          this.write('')
          this.write(`Tags (${detail.tags.length}):`)
          for (const tag of detail.tags) {
            this.write(`  ${tag.name} (${tag.category})`)
          }
        }

        if (detail.analyses.length > 0) {
          this.write('')
          this.write(`Analyses (${detail.analyses.length}):`)
          for (const analysis of detail.analyses) {
            this.write(`  Analysis ${analysis.id} (${analysis.createdAt}):`)
            if (analysis.generatedTags.length > 0) {
              this.write(`    Generated tags:`)
              for (const tag of analysis.generatedTags) {
                this.write(`      ${tag.name} (${tag.category})`)
              }
            }
            if (analysis.suggestion) {
              this.write(`    Suggestion: ${analysis.suggestion.content}`)
              this.write(`    Reasoning: ${analysis.suggestion.reasoning}`)
            }
          }
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
