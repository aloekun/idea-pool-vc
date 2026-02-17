import type { IdeaAnalysisAPI } from '../../application/api/idea-analysis-api.js'
import { SuggestActionRequest } from '../../application/requests/suggest-action-request.js'
import type { Logger } from '../logger.js'
import { consoleLogger } from '../logger.js'
import { handleCommandError } from './handle-command-error.js'

export async function handleSuggestCommand(
  api: IdeaAnalysisAPI,
  ideaId: string,
  analysisId?: string,
  logger: Logger = consoleLogger
): Promise<void> {
  try {
    const request = new SuggestActionRequest(ideaId, analysisId)
    const response = await api.suggestAction(request)

    if (response.success) {
      const { usedAnalysisId, suggestion, createdAt } = response.data
      logger.log('Suggestion generated successfully')
      logger.log(`Used analysis: ${usedAnalysisId}`)
      logger.log(`Created: ${createdAt}`)
      logger.log('')
      logger.log(`Suggestion: ${suggestion.content}`)
      logger.log(`Reasoning: ${suggestion.reasoning}`)
    } else {
      logger.error(`Error: ${response.error.message}`)
    }
  } catch (error) {
    handleCommandError(error, logger)
  }
}
