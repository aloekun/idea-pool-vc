import type { IdeaAnalysisAPI } from '../../application/api/idea-analysis-api.js'
import { AnalyzeIdeaRequest } from '../../application/requests/analyze-idea-request.js'
import { ValidationError } from '../../domain/index.js'

export async function handleAnalyzeCommand(
  api: IdeaAnalysisAPI,
  ideaId: string
): Promise<void> {
  try {
    const request = new AnalyzeIdeaRequest(ideaId)
    const response = await api.analyzeIdea(request)

    if (response.success) {
      const { analysisId, generatedTags, createdAt } = response.data
      console.log(`Analysis completed (ID: ${analysisId})`)
      console.log(`Created: ${createdAt}`)
      console.log('')
      console.log('Generated Tags:')
      for (const tag of generatedTags) {
        console.log(`  [${tag.category}] ${tag.name}`)
      }
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
