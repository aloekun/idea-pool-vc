import type { APIResponse } from '../dto/index.js'
import { createSuccessResponse, createErrorResponse, ERROR_CODES, toTagDTO } from '../dto/index.js'
import type {
  AddIdeaResponse,
  AppendChunkResponse,
  AddTagResponse,
  RemoveTagResponse,
  ArchiveIdeaResponse,
  RestoreIdeaResponse,
} from '../responses/index.js'
import type { AddIdeaRequest } from '../requests/add-idea-request.js'
import type { AppendChunkRequest } from '../requests/append-chunk-request.js'
import type { AddTagRequest } from '../requests/add-tag-request.js'
import type { RemoveTagRequest } from '../requests/remove-tag-request.js'
import type { ArchiveIdeaRequest } from '../requests/archive-idea-request.js'
import type { RestoreIdeaRequest } from '../requests/restore-idea-request.js'
import type { AddIdeaUseCase } from '../use-cases/add-idea-use-case.js'
import type { AppendChunkUseCase } from '../use-cases/append-chunk-use-case.js'
import type { AddTagUseCase } from '../use-cases/add-tag-use-case.js'
import type { RemoveTagUseCase } from '../use-cases/remove-tag-use-case.js'
import type { ArchiveIdeaUseCase } from '../use-cases/archive-idea-use-case.js'
import type { RestoreIdeaUseCase } from '../use-cases/restore-idea-use-case.js'
import type { ShowIdeaUseCase } from '../use-cases/show-idea-use-case.js'
import { IdeaId, Tag, TagCategory } from '../../domain/index.js'
import { convertDomainErrorToAPIError } from './error-converter.js'

export class IdeaCommandAPI {
  constructor(
    private readonly addIdeaUseCase: AddIdeaUseCase,
    private readonly appendChunkUseCase: AppendChunkUseCase,
    private readonly addTagUseCase: AddTagUseCase,
    private readonly removeTagUseCase: RemoveTagUseCase,
    private readonly archiveIdeaUseCase: ArchiveIdeaUseCase,
    private readonly restoreIdeaUseCase: RestoreIdeaUseCase,
    private readonly showIdeaUseCase: ShowIdeaUseCase
  ) {}

  async addIdea(request: AddIdeaRequest): Promise<APIResponse<AddIdeaResponse>> {
    const result = await this.addIdeaUseCase.execute(request.content)

    if (result.isFailure) {
      return convertDomainErrorToAPIError(result.error)
    }

    const showResult = await this.showIdeaUseCase.execute(result.value)
    if (showResult.isFailure) {
      return convertDomainErrorToAPIError(showResult.error)
    }

    const idea = showResult.value
    return createSuccessResponse<AddIdeaResponse>({
      ideaId: idea.id.value,
      content: idea.content,
      createdAt: idea.createdAt.toISOString(),
    })
  }

  async appendChunk(request: AppendChunkRequest): Promise<APIResponse<AppendChunkResponse>> {
    const ideaId = IdeaId.fromString(request.ideaId)
    const result = await this.appendChunkUseCase.execute(ideaId, request.content)

    if (result.isFailure) {
      return convertDomainErrorToAPIError(result.error)
    }

    const showResult = await this.showIdeaUseCase.execute(ideaId)
    if (showResult.isFailure) {
      return convertDomainErrorToAPIError(showResult.error)
    }

    const idea = showResult.value
    const newChunk = idea.chunks[idea.chunks.length - 1]

    return createSuccessResponse<AppendChunkResponse>({
      ideaId: idea.id.value,
      chunkId: newChunk.id.value,
      content: newChunk.content,
      createdAt: newChunk.createdAt.toISOString(),
    })
  }

  async addTag(request: AddTagRequest): Promise<APIResponse<AddTagResponse>> {
    try {
      const ideaId = IdeaId.fromString(request.ideaId)
      const category = TagCategory.fromString(request.tagCategory)
      const tag = Tag.create(request.tagName, category)

      const result = await this.addTagUseCase.execute(ideaId, tag)

      if (result.isFailure) {
        return convertDomainErrorToAPIError(result.error)
      }

      return createSuccessResponse<AddTagResponse>({
        ideaId: request.ideaId,
        tag: toTagDTO(tag),
      })
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse({
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message,
        })
      }
      return createErrorResponse({
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      })
    }
  }

  async removeTag(request: RemoveTagRequest): Promise<APIResponse<RemoveTagResponse>> {
    const ideaId = IdeaId.fromString(request.ideaId)

    const showResult = await this.showIdeaUseCase.execute(ideaId)
    if (showResult.isFailure) {
      return convertDomainErrorToAPIError(showResult.error)
    }

    const idea = showResult.value
    const existingTag = idea.tags.find((t) => t.name === request.tagName)
    if (!existingTag) {
      return createErrorResponse({
        code: ERROR_CODES.NOT_FOUND,
        message: `Tag "${request.tagName}" not found on this idea`,
        details: { tagName: request.tagName },
      })
    }

    const result = await this.removeTagUseCase.execute(ideaId, existingTag)

    if (result.isFailure) {
      return convertDomainErrorToAPIError(result.error)
    }

    return createSuccessResponse<RemoveTagResponse>({
      ideaId: request.ideaId,
      removedTagName: request.tagName,
    })
  }

  async archiveIdea(request: ArchiveIdeaRequest): Promise<APIResponse<ArchiveIdeaResponse>> {
    const ideaId = IdeaId.fromString(request.ideaId)
    const result = await this.archiveIdeaUseCase.execute(ideaId)

    if (result.isFailure) {
      return convertDomainErrorToAPIError(result.error)
    }

    const showResult = await this.showIdeaUseCase.execute(ideaId)
    if (showResult.isFailure) {
      return convertDomainErrorToAPIError(showResult.error)
    }

    const idea = showResult.value
    return createSuccessResponse<ArchiveIdeaResponse>({
      ideaId: request.ideaId,
      archivedAt: idea.archivedAt!.toISOString(),
    })
  }

  async restoreIdea(request: RestoreIdeaRequest): Promise<APIResponse<RestoreIdeaResponse>> {
    const ideaId = IdeaId.fromString(request.ideaId)
    const result = await this.restoreIdeaUseCase.execute(ideaId)

    if (result.isFailure) {
      return convertDomainErrorToAPIError(result.error)
    }

    return createSuccessResponse<RestoreIdeaResponse>({
      ideaId: request.ideaId,
    })
  }
}
