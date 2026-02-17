import type { AddIdeaUseCase } from '../use-cases/add-idea-use-case.js'
import type { AppendChunkUseCase } from '../use-cases/append-chunk-use-case.js'
import type { AddTagUseCase } from '../use-cases/add-tag-use-case.js'
import type { RemoveTagUseCase } from '../use-cases/remove-tag-use-case.js'
import type { ArchiveIdeaUseCase } from '../use-cases/archive-idea-use-case.js'
import type { RestoreIdeaUseCase } from '../use-cases/restore-idea-use-case.js'
import type { AddIdeaRequest } from '../requests/command-requests.js'
import type { AppendChunkRequest } from '../requests/command-requests.js'
import type { AddTagRequest } from '../requests/command-requests.js'
import type { RemoveTagRequest } from '../requests/command-requests.js'
import type { ArchiveIdeaRequest } from '../requests/command-requests.js'
import type { RestoreIdeaRequest } from '../requests/command-requests.js'
import type { AddIdeaResponse } from '../responses/command-responses.js'
import type { AppendChunkResponse } from '../responses/command-responses.js'
import type { AddTagResponse } from '../responses/command-responses.js'
import type { RemoveTagResponse } from '../responses/command-responses.js'
import type { ArchiveIdeaResponse } from '../responses/command-responses.js'
import type { RestoreIdeaResponse } from '../responses/command-responses.js'
import type { APIResponse } from '../dto/api-response.js'
import { ERROR_CODES } from '../dto/api-response.js'
import { DomainError, IdeaId, Tag, TagCategory } from '../../domain/index.js'
import { convertDomainErrorToAPIError } from './error-converter.js'

export class IdeaCommandAPI {
  constructor(
    private readonly addIdeaUseCase: AddIdeaUseCase,
    private readonly appendChunkUseCase: AppendChunkUseCase,
    private readonly addTagUseCase: AddTagUseCase,
    private readonly removeTagUseCase: RemoveTagUseCase,
    private readonly archiveIdeaUseCase: ArchiveIdeaUseCase,
    private readonly restoreIdeaUseCase: RestoreIdeaUseCase
  ) {}

  async addIdea(request: AddIdeaRequest): Promise<APIResponse<AddIdeaResponse>> {
    const result = await this.addIdeaUseCase.execute(request.content)

    if (result.isSuccess) {
      return {
        success: true,
        data: {
          ideaId: result.value.value,
          content: request.content,
          createdAt: new Date().toISOString(),
        },
      }
    }
    return convertDomainErrorToAPIError(result.error)
  }

  async appendChunk(request: AppendChunkRequest): Promise<APIResponse<AppendChunkResponse>> {
    try {
      const ideaId = IdeaId.fromString(request.ideaId)
      const result = await this.appendChunkUseCase.execute(ideaId, request.content)

      if (result.isSuccess) {
        const chunk = result.value
        return {
          success: true,
          data: {
            ideaId: request.ideaId,
            chunkId: chunk.id.value,
            content: chunk.content,
            createdAt: chunk.createdAt.toISOString(),
          },
        }
      }
      return convertDomainErrorToAPIError(result.error)
    } catch (error) {
      if (error instanceof DomainError) {
        return convertDomainErrorToAPIError(error)
      }
      return {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      }
    }
  }

  async addTag(request: AddTagRequest): Promise<APIResponse<AddTagResponse>> {
    try {
      const ideaId = IdeaId.fromString(request.ideaId)
      const category = TagCategory.fromString(request.tagCategory)
      const tag = Tag.create(request.tagName, category)
      const result = await this.addTagUseCase.execute(ideaId, tag)

      if (result.isSuccess) {
        return {
          success: true,
          data: {
            ideaId: request.ideaId,
            tag: {
              name: request.tagName,
              category: request.tagCategory,
            },
          },
        }
      }
      return convertDomainErrorToAPIError(result.error)
    } catch (error) {
      if (error instanceof DomainError) {
        return convertDomainErrorToAPIError(error)
      }
      return {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      }
    }
  }

  async removeTag(request: RemoveTagRequest): Promise<APIResponse<RemoveTagResponse>> {
    try {
      const ideaId = IdeaId.fromString(request.ideaId)
      const result = await this.removeTagUseCase.execute(ideaId, request.tagName)

      if (result.isSuccess) {
        return {
          success: true,
          data: {
            ideaId: request.ideaId,
            removedTagName: request.tagName,
          },
        }
      }
      return convertDomainErrorToAPIError(result.error)
    } catch (error) {
      if (error instanceof DomainError) {
        return convertDomainErrorToAPIError(error)
      }
      return {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      }
    }
  }

  async archiveIdea(request: ArchiveIdeaRequest): Promise<APIResponse<ArchiveIdeaResponse>> {
    try {
      const ideaId = IdeaId.fromString(request.ideaId)
      const result = await this.archiveIdeaUseCase.execute(ideaId)

      if (result.isSuccess) {
        return {
          success: true,
          data: {
            ideaId: request.ideaId,
            archivedAt: new Date().toISOString(),
          },
        }
      }
      return convertDomainErrorToAPIError(result.error)
    } catch (error) {
      if (error instanceof DomainError) {
        return convertDomainErrorToAPIError(error)
      }
      return {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      }
    }
  }

  async restoreIdea(request: RestoreIdeaRequest): Promise<APIResponse<RestoreIdeaResponse>> {
    try {
      const ideaId = IdeaId.fromString(request.ideaId)
      const result = await this.restoreIdeaUseCase.execute(ideaId)

      if (result.isSuccess) {
        return {
          success: true,
          data: {
            ideaId: request.ideaId,
          },
        }
      }
      return convertDomainErrorToAPIError(result.error)
    } catch (error) {
      if (error instanceof DomainError) {
        return convertDomainErrorToAPIError(error)
      }
      return {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      }
    }
  }
}
