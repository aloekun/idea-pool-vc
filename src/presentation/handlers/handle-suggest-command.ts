import type { IdeaAnalysisAPI } from '../../application/api/idea-analysis-api.js'
import { SuggestActionRequest } from '../../application/requests/suggest-action-request.js'
import { ValidationError } from '../../domain/index.js'

export async function handleSuggestCommand(
  api: IdeaAnalysisAPI,
  ideaId: string,
  analysisId?: string
): Promise<void> {
  try {
    const request = new SuggestActionRequest(ideaId, analysisId)
    const response = await api.suggestAction(request)

    if (response.success) {
      const { usedAnalysisId, suggestion, createdAt } = response.data
      console.log('Suggestion generated successfully')
      console.log(`Used analysis: ${usedAnalysisId}`)
      console.log(`Created: ${createdAt}`)
      console.log('')
      console.log(`Suggestion: ${suggestion.content}`)
      console.log(`Reasoning: ${suggestion.reasoning}`)
    } else {
      console.error(`Error: ${response.error.message}`)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`Error: ${error.message}`)
    } else {
      console.error('Error: An unexpected error occurred.')
    }
  }
}
