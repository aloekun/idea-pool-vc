import type { ILLMService } from '../../domain/interfaces/index.js'
import { Tag, Suggestion, TagCategory, LLMServiceError } from '../../domain/index.js'
import type { Chunk } from '../../domain/index.js'

interface OllamaGenerateRequest {
  model: string
  prompt: string
  format: 'json'
  stream: false
}

interface OllamaGenerateResponse {
  response: string
}

interface GeneratedTagsResponse {
  tags: Array<{
    name: string
    category: string
  }>
}

interface GeneratedSuggestionResponse {
  suggestion: {
    content: string
    reasoning: string
  }
}

const GENERATE_TAGS_PROMPT = `You are an assistant that analyzes software ideas.
Analyze the following idea and generate tags in JSON format.

Idea:
{ideaContent}

{chunksSection}

For each of the following 6 categories, choose the most appropriate tag:

Output format:
{
  "tags": [
    {"name": "tag name", "category": "NATURE"},
    {"name": "tag name", "category": "SCALE"},
    {"name": "tag name", "category": "DIFFICULTY"},
    {"name": "tag name", "category": "PHASE"},
    {"name": "tag name", "category": "RISK"},
    {"name": "tag name", "category": "DOMAIN"}
  ]
}

Category descriptions:
- NATURE: New development, improvement, experiment, learning, etc.
- SCALE: Small-scale, medium-scale, large-scale, etc.
- DIFFICULTY: Easy, normal, difficult, etc.
- PHASE: Concept stage, design stage, implementation stage, etc.
- RISK: Low risk, medium risk, high risk, etc.
- DOMAIN: Web development, mobile, AI/ML, infrastructure, etc.

Generate Japanese tag names.`

const GENERATE_SUGGESTION_PROMPT = `You are an assistant that suggests next steps for software ideas.
You should not give definitive answers but help move thinking forward.

Idea:
{ideaContent}

{chunksSection}

Tags:
{tagsSection}

Consider the following points and suggest next steps for this idea:
- Realistic and actionable steps
- A gradual approach appropriate for the scale and difficulty of the idea
- A careful approach considering risks

Output format:
{
  "suggestion": {
    "content": "Suggestion content (2-3 sentences, concise)",
    "reasoning": "Why this suggestion is appropriate (1-2 sentences)"
  }
}

Note:
- Do not use imperative commands
- Use soft expressions like "How about trying..." or "It might be good to consider..."
- Make suggestions that respect the user's situation and constraints
- Generate in Japanese.`

export class OllamaLLMService implements ILLMService {
  constructor(
    private readonly baseUrl: string = 'http://localhost:11434',
    private readonly model: string = 'llama3.2'
  ) {}

  async generateTags(
    ideaContent: string,
    chunks: readonly Chunk[]
  ): Promise<readonly Tag[]> {
    const chunksSection =
      chunks.length > 0
        ? `Additional notes:\n${chunks.map((c) => c.content).join('\n')}`
        : ''

    const prompt = GENERATE_TAGS_PROMPT.replace('{ideaContent}', ideaContent).replace(
      '{chunksSection}',
      chunksSection
    )

    try {
      const response = await this.callOllama(prompt)
      const parsed = JSON.parse(response) as GeneratedTagsResponse

      return parsed.tags.map((t) =>
        Tag.create(t.name, TagCategory.fromString(t.category))
      )
    } catch (error) {
      if (error instanceof LLMServiceError) {
        throw error
      }
      throw new LLMServiceError(
        `Failed to generate tags: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async generateSuggestion(
    ideaContent: string,
    chunks: readonly Chunk[],
    tags: readonly Tag[]
  ): Promise<Suggestion> {
    const chunksSection =
      chunks.length > 0
        ? `Additional notes:\n${chunks.map((c) => c.content).join('\n')}`
        : ''

    const tagsSection = tags.map((t) => `${t.name} (${t.category.value})`).join(', ')

    const prompt = GENERATE_SUGGESTION_PROMPT.replace('{ideaContent}', ideaContent)
      .replace('{chunksSection}', chunksSection)
      .replace('{tagsSection}', tagsSection)

    try {
      const response = await this.callOllama(prompt)
      const parsed = JSON.parse(response) as GeneratedSuggestionResponse

      return Suggestion.create(
        parsed.suggestion.content,
        parsed.suggestion.reasoning
      )
    } catch (error) {
      if (error instanceof LLMServiceError) {
        throw error
      }
      throw new LLMServiceError(
        `Failed to generate suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }

  private async callOllama(prompt: string): Promise<string> {
    const request: OllamaGenerateRequest = {
      model: this.model,
      prompt,
      format: 'json',
      stream: false,
    }

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new LLMServiceError(
        `Ollama API error: ${response.status} ${response.statusText}`
      )
    }

    const data = (await response.json()) as OllamaGenerateResponse
    return data.response
  }
}
