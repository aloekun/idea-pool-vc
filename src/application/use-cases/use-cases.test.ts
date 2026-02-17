import { describe, it, expect, beforeEach } from 'vitest'
import { AddIdeaUseCase } from './add-idea-use-case.js'
import { AppendChunkUseCase } from './append-chunk-use-case.js'
import { ListIdeasUseCase } from './list-ideas-use-case.js'
import { ShowIdeaUseCase } from './show-idea-use-case.js'
import { AnalyzeIdeaUseCase } from './analyze-idea-use-case.js'
import { SuggestActionUseCase } from './suggest-action-use-case.js'
import { AddTagUseCase } from './add-tag-use-case.js'
import { RemoveTagUseCase } from './remove-tag-use-case.js'
import { ArchiveIdeaUseCase } from './archive-idea-use-case.js'
import { RestoreIdeaUseCase } from './restore-idea-use-case.js'
import { MockIdeaRepository } from '../../infrastructure/testing/mock-idea-repository.js'
import { MockLLMService } from '../../infrastructure/testing/mock-llm-service.js'
import { IdeaId, Tag, TagCategory } from '../../domain/index.js'

describe('AppendChunkUseCase', () => {
  let repository: MockIdeaRepository
  let addIdea: AddIdeaUseCase
  let appendChunk: AppendChunkUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    addIdea = new AddIdeaUseCase(repository)
    appendChunk = new AppendChunkUseCase(repository)
  })

  it('should append a chunk to an existing idea', async () => {
    const addResult = await addIdea.execute('My idea')
    expect(addResult.isSuccess).toBe(true)
    if (!addResult.isSuccess) return

    const result = await appendChunk.execute(addResult.value, 'Additional note')
    expect(result.isSuccess).toBe(true)

    const idea = await repository.findById(addResult.value)
    expect(idea!.chunks).toHaveLength(1)
    expect(idea!.chunks[0].content).toBe('Additional note')
  })

  it('should fail when idea does not exist', async () => {
    const fakeId = IdeaId.generate()
    const result = await appendChunk.execute(fakeId, 'Some content')

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })

  it('should fail with empty content', async () => {
    const addResult = await addIdea.execute('My idea')
    if (!addResult.isSuccess) return

    const result = await appendChunk.execute(addResult.value, '')
    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('should preserve original idea content when adding chunk', async () => {
    const addResult = await addIdea.execute('Original content')
    if (!addResult.isSuccess) return

    await appendChunk.execute(addResult.value, 'Chunk 1')
    await appendChunk.execute(addResult.value, 'Chunk 2')

    const idea = await repository.findById(addResult.value)
    expect(idea!.content).toBe('Original content')
  })
})

describe('ListIdeasUseCase', () => {
  let repository: MockIdeaRepository
  let addIdea: AddIdeaUseCase
  let archiveIdea: ArchiveIdeaUseCase
  let listIdeas: ListIdeasUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    addIdea = new AddIdeaUseCase(repository)
    archiveIdea = new ArchiveIdeaUseCase(repository)
    listIdeas = new ListIdeasUseCase(repository)
  })

  it('should list all active ideas', async () => {
    await addIdea.execute('Idea 1')
    await addIdea.execute('Idea 2')

    const result = await listIdeas.execute()
    expect(result.isSuccess).toBe(true)
    if (result.isSuccess) {
      expect(result.value).toHaveLength(2)
    }
  })

  it('should respect limit', async () => {
    await addIdea.execute('Idea 1')
    await addIdea.execute('Idea 2')
    await addIdea.execute('Idea 3')

    const result = await listIdeas.execute({ limit: 2 })
    expect(result.isSuccess).toBe(true)
    if (result.isSuccess) {
      expect(result.value).toHaveLength(2)
    }
  })

  it('should filter archived ideas', async () => {
    const r1 = await addIdea.execute('Idea 1')
    await addIdea.execute('Idea 2')
    if (r1.isSuccess) {
      await archiveIdea.execute(r1.value)
    }

    const activeResult = await listIdeas.execute()
    expect(activeResult.isSuccess).toBe(true)
    if (activeResult.isSuccess) {
      expect(activeResult.value).toHaveLength(1)
    }

    const archivedResult = await listIdeas.execute({ archivedOnly: true })
    expect(archivedResult.isSuccess).toBe(true)
    if (archivedResult.isSuccess) {
      expect(archivedResult.value).toHaveLength(1)
    }

    const allResult = await listIdeas.execute({ includeArchived: true })
    expect(allResult.isSuccess).toBe(true)
    if (allResult.isSuccess) {
      expect(allResult.value).toHaveLength(2)
    }
  })
})

describe('ShowIdeaUseCase', () => {
  let repository: MockIdeaRepository
  let addIdea: AddIdeaUseCase
  let showIdea: ShowIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    addIdea = new AddIdeaUseCase(repository)
    showIdea = new ShowIdeaUseCase(repository)
  })

  it('should return idea detail', async () => {
    const addResult = await addIdea.execute('Detailed idea')
    if (!addResult.isSuccess) return

    const result = await showIdea.execute(addResult.value)
    expect(result.isSuccess).toBe(true)
    if (result.isSuccess) {
      expect(result.value.content).toBe('Detailed idea')
      expect(result.value.id.equals(addResult.value)).toBe(true)
    }
  })

  it('should fail when idea does not exist', async () => {
    const fakeId = IdeaId.generate()
    const result = await showIdea.execute(fakeId)

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })
})

describe('AnalyzeIdeaUseCase', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let addIdea: AddIdeaUseCase
  let analyzeIdea: AnalyzeIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    addIdea = new AddIdeaUseCase(repository)
    analyzeIdea = new AnalyzeIdeaUseCase(repository, llmService)
  })

  it('should analyze an idea and store tags', async () => {
    const addResult = await addIdea.execute('Analyze this idea')
    if (!addResult.isSuccess) return

    const result = await analyzeIdea.execute(addResult.value)
    expect(result.isSuccess).toBe(true)
    if (result.isSuccess) {
      expect(result.value.generatedTags.length).toBeGreaterThan(0)
    }

    const idea = await repository.findById(addResult.value)
    expect(idea!.analyses).toHaveLength(1)
  })

  it('should fail when idea does not exist', async () => {
    const fakeId = IdeaId.generate()
    const result = await analyzeIdea.execute(fakeId)

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })

  it('should handle LLM service failure', async () => {
    llmService.setShouldFail(true, 'Connection refused')
    const addResult = await addIdea.execute('Test idea')
    if (!addResult.isSuccess) return

    const result = await analyzeIdea.execute(addResult.value)
    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('LLM_SERVICE_ERROR')
    }
  })
})

describe('SuggestActionUseCase', () => {
  let repository: MockIdeaRepository
  let llmService: MockLLMService
  let addIdea: AddIdeaUseCase
  let analyzeIdea: AnalyzeIdeaUseCase
  let suggestAction: SuggestActionUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    llmService = new MockLLMService()
    addIdea = new AddIdeaUseCase(repository)
    analyzeIdea = new AnalyzeIdeaUseCase(repository, llmService)
    suggestAction = new SuggestActionUseCase(repository, llmService)
  })

  it('should generate suggestion using latest analysis', async () => {
    const addResult = await addIdea.execute('Suggest for this')
    if (!addResult.isSuccess) return

    await analyzeIdea.execute(addResult.value)
    const result = await suggestAction.execute(addResult.value)

    expect(result.isSuccess).toBe(true)
    if (result.isSuccess) {
      expect(result.value.suggestion.content).toBeTruthy()
      expect(result.value.suggestion.reasoning).toBeTruthy()
      expect(result.value.usedAnalysisId).toBeTruthy()
      expect(result.value.analysisId).toBeTruthy()
    }
  })

  it('should fail when idea has no analysis', async () => {
    const addResult = await addIdea.execute('No analysis idea')
    if (!addResult.isSuccess) return

    const result = await suggestAction.execute(addResult.value)
    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })

  it('should fail when specified analysis does not exist', async () => {
    const addResult = await addIdea.execute('Test idea')
    if (!addResult.isSuccess) return

    await analyzeIdea.execute(addResult.value)
    const fakeAnalysisId = { value: 'nonexistent', equals: () => false } as any
    const result = await suggestAction.execute(addResult.value, fakeAnalysisId)

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })

  it('should handle LLM service failure', async () => {
    const addResult = await addIdea.execute('Test idea')
    if (!addResult.isSuccess) return

    await analyzeIdea.execute(addResult.value)
    llmService.setShouldFail(true, 'Service unavailable')

    const result = await suggestAction.execute(addResult.value)
    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('LLM_SERVICE_ERROR')
    }
  })
})

describe('AddTagUseCase', () => {
  let repository: MockIdeaRepository
  let addIdea: AddIdeaUseCase
  let addTag: AddTagUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    addIdea = new AddIdeaUseCase(repository)
    addTag = new AddTagUseCase(repository)
  })

  it('should add a tag to an idea', async () => {
    const addResult = await addIdea.execute('Tag this idea')
    if (!addResult.isSuccess) return

    const tag = Tag.create('Web', TagCategory.domain())
    const result = await addTag.execute(addResult.value, tag)

    expect(result.isSuccess).toBe(true)

    const idea = await repository.findById(addResult.value)
    expect(idea!.tags).toHaveLength(1)
    expect(idea!.tags[0].name).toBe('Web')
  })

  it('should fail when idea does not exist', async () => {
    const fakeId = IdeaId.generate()
    const tag = Tag.create('Web', TagCategory.domain())
    const result = await addTag.execute(fakeId, tag)

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })
})

describe('RemoveTagUseCase', () => {
  let repository: MockIdeaRepository
  let addIdea: AddIdeaUseCase
  let addTag: AddTagUseCase
  let removeTag: RemoveTagUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    addIdea = new AddIdeaUseCase(repository)
    addTag = new AddTagUseCase(repository)
    removeTag = new RemoveTagUseCase(repository)
  })

  it('should remove a tag from an idea', async () => {
    const addResult = await addIdea.execute('Tagged idea')
    if (!addResult.isSuccess) return

    const tag = Tag.create('Web', TagCategory.domain())
    await addTag.execute(addResult.value, tag)

    const result = await removeTag.execute(addResult.value, tag)
    expect(result.isSuccess).toBe(true)

    const idea = await repository.findById(addResult.value)
    expect(idea!.tags).toHaveLength(0)
  })

  it('should fail when idea does not exist', async () => {
    const fakeId = IdeaId.generate()
    const tag = Tag.create('Web', TagCategory.domain())
    const result = await removeTag.execute(fakeId, tag)

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })
})

describe('ArchiveIdeaUseCase', () => {
  let repository: MockIdeaRepository
  let addIdea: AddIdeaUseCase
  let archiveIdea: ArchiveIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    addIdea = new AddIdeaUseCase(repository)
    archiveIdea = new ArchiveIdeaUseCase(repository)
  })

  it('should archive an idea', async () => {
    const addResult = await addIdea.execute('Archive me')
    if (!addResult.isSuccess) return

    const result = await archiveIdea.execute(addResult.value)
    expect(result.isSuccess).toBe(true)

    const idea = await repository.findById(addResult.value)
    expect(idea!.isArchived()).toBe(true)
  })

  it('should fail when idea does not exist', async () => {
    const fakeId = IdeaId.generate()
    const result = await archiveIdea.execute(fakeId)

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })
})

describe('RestoreIdeaUseCase', () => {
  let repository: MockIdeaRepository
  let addIdea: AddIdeaUseCase
  let archiveIdea: ArchiveIdeaUseCase
  let restoreIdea: RestoreIdeaUseCase

  beforeEach(() => {
    repository = new MockIdeaRepository()
    addIdea = new AddIdeaUseCase(repository)
    archiveIdea = new ArchiveIdeaUseCase(repository)
    restoreIdea = new RestoreIdeaUseCase(repository)
  })

  it('should restore an archived idea', async () => {
    const addResult = await addIdea.execute('Restore me')
    if (!addResult.isSuccess) return

    await archiveIdea.execute(addResult.value)
    const result = await restoreIdea.execute(addResult.value)

    expect(result.isSuccess).toBe(true)

    const idea = await repository.findById(addResult.value)
    expect(idea!.isArchived()).toBe(false)
  })

  it('should fail when idea does not exist', async () => {
    const fakeId = IdeaId.generate()
    const result = await restoreIdea.execute(fakeId)

    expect(result.isFailure).toBe(true)
    if (result.isFailure) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })
})
