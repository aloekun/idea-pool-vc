import type { IdeaCommandAPI } from '../../application/api/idea-command-api.js'
import {
  AddIdeaRequest,
  AppendChunkRequest,
  AddTagRequest,
  RemoveTagRequest,
  ArchiveIdeaRequest,
  RestoreIdeaRequest,
} from '../../application/requests/command-requests.js'
import { ValidationError } from '../../domain/index.js'

type OutputWriter = (message: string) => void

export async function handleAddCommand(
  api: IdeaCommandAPI,
  content: string,
  write: OutputWriter
): Promise<void> {
  try {
    const request = new AddIdeaRequest(content)
    const response = await api.addIdea(request)

    if (response.success) {
      write(`Idea added (ID: ${response.data.ideaId})`)
      write(`  Content: ${response.data.content}`)
      write(`  Created: ${response.data.createdAt}`)
    } else {
      write(`Error: ${response.error.message}`)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      write(`Error: ${error.message}`)
    } else {
      write('Error: An unexpected error occurred')
    }
  }
}

export async function handleAppendCommand(
  api: IdeaCommandAPI,
  ideaId: string,
  content: string,
  write: OutputWriter
): Promise<void> {
  try {
    const request = new AppendChunkRequest(ideaId, content)
    const response = await api.appendChunk(request)

    if (response.success) {
      write(`Chunk appended (ID: ${response.data.chunkId})`)
      write(`  Idea: ${response.data.ideaId}`)
      write(`  Content: ${response.data.content}`)
      write(`  Created: ${response.data.createdAt}`)
    } else {
      write(`Error: ${response.error.message}`)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      write(`Error: ${error.message}`)
    } else {
      write('Error: An unexpected error occurred')
    }
  }
}

export async function handleAddTagCommand(
  api: IdeaCommandAPI,
  ideaId: string,
  tagName: string,
  tagCategory: string,
  write: OutputWriter
): Promise<void> {
  try {
    const request = new AddTagRequest(ideaId, tagName, tagCategory)
    const response = await api.addTag(request)

    if (response.success) {
      write(`Tag added: ${response.data.tag.name} [${response.data.tag.category}]`)
      write(`  Idea: ${response.data.ideaId}`)
    } else {
      write(`Error: ${response.error.message}`)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      write(`Error: ${error.message}`)
    } else if (error instanceof Error) {
      write(`Error: ${error.message}`)
    } else {
      write('Error: An unexpected error occurred')
    }
  }
}

export async function handleRemoveTagCommand(
  api: IdeaCommandAPI,
  ideaId: string,
  tagName: string,
  write: OutputWriter
): Promise<void> {
  try {
    const request = new RemoveTagRequest(ideaId, tagName)
    const response = await api.removeTag(request)

    if (response.success) {
      write(`Tag removed: ${response.data.removedTagName}`)
      write(`  Idea: ${response.data.ideaId}`)
    } else {
      write(`Error: ${response.error.message}`)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      write(`Error: ${error.message}`)
    } else {
      write('Error: An unexpected error occurred')
    }
  }
}

export async function handleArchiveCommand(
  api: IdeaCommandAPI,
  ideaId: string,
  write: OutputWriter
): Promise<void> {
  try {
    const request = new ArchiveIdeaRequest(ideaId)
    const response = await api.archiveIdea(request)

    if (response.success) {
      write(`Idea archived (ID: ${response.data.ideaId})`)
      write(`  Archived at: ${response.data.archivedAt}`)
    } else {
      write(`Error: ${response.error.message}`)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      write(`Error: ${error.message}`)
    } else {
      write('Error: An unexpected error occurred')
    }
  }
}

export async function handleRestoreCommand(
  api: IdeaCommandAPI,
  ideaId: string,
  write: OutputWriter
): Promise<void> {
  try {
    const request = new RestoreIdeaRequest(ideaId)
    const response = await api.restoreIdea(request)

    if (response.success) {
      write(`Idea restored (ID: ${response.data.ideaId})`)
    } else {
      write(`Error: ${response.error.message}`)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      write(`Error: ${error.message}`)
    } else {
      write('Error: An unexpected error occurred')
    }
  }
}
