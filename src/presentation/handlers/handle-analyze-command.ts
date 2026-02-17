import type { IdeaAnalysisAPI } from '../../application/api/idea-analysis-api.js'
import { AnalyzeIdeaRequest } from '../../application/requests/analyze-idea-request.js'
import type { Logger } from '../logger.js'
import { consoleLogger } from '../logger.js'
import { handleCommandError } from './handle-command-error.js'

export async function handleAnalyzeCommand(
  api: IdeaAnalysisAPI,
  ideaId: string,
  logger: Logger = consoleLogger
): Promise<void> {
  try {
    const request = new AnalyzeIdeaRequest(ideaId)
    const response = await api.analyzeIdea(request)

    if (response.success) {
      const { analysisId, generatedTags, createdAt } = response.data
      logger.log(`Analysis completed (ID: ${analysisId})`)
      logger.log(`Created: ${createdAt}`)
      logger.log('')
      logger.log('Generated Tags:')
      for (const tag of generatedTags) {
        logger.log(`  [${tag.category}] ${tag.name}`)
      }
    } else {
      logger.error(`Error: ${response.error.message}`)
    }
  } catch (error) {
    handleCommandError(error, logger)
  }
}
