import { describe, it, expect, afterEach } from 'vitest'
import { DIContainer } from './di-container.js'
import type { AppConfig } from '../config/config.js'
import { AddIdeaUseCase } from '../../application/use-cases/add-idea-use-case.js'
import { AppendChunkUseCase } from '../../application/use-cases/append-chunk-use-case.js'
import { ListIdeasUseCase } from '../../application/usecases/list-ideas-use-case.js'
import { ShowIdeaUseCase } from '../../application/usecases/show-idea-use-case.js'
import { AnalyzeIdeaUseCase } from '../../application/use-cases/analyze-idea-use-case.js'
import { SuggestActionUseCase } from '../../application/use-cases/suggest-action-use-case.js'
import { AddTagUseCase } from '../../application/use-cases/add-tag-use-case.js'
import { RemoveTagUseCase } from '../../application/use-cases/remove-tag-use-case.js'
import { ArchiveIdeaUseCase } from '../../application/use-cases/archive-idea-use-case.js'
import { RestoreIdeaUseCase } from '../../application/use-cases/restore-idea-use-case.js'
import { IdeaCommandAPI } from '../../application/api/idea-command-api.js'
import { IdeaQueryAPI } from '../../application/api/idea-query-api.js'
import { IdeaAnalysisAPI } from '../../application/api/idea-analysis-api.js'
import { CLIController } from '../../presentation/cli-controller.js'

const TEST_CONFIG: AppConfig = {
  llm: {
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  },
  database: {
    path: ':memory:',
  },
  list: {
    defaultLimit: 10,
  },
}

describe('DIContainer', () => {
  let container: DIContainer

  afterEach(() => {
    if (container) {
      container.close()
    }
  })

  it('should create a database connection', () => {
    container = new DIContainer(TEST_CONFIG)
    const connection = container.getOrCreateDatabaseConnection()
    expect(connection).toBeTruthy()
  })

  it('should reuse the same database connection', () => {
    container = new DIContainer(TEST_CONFIG)
    const conn1 = container.getOrCreateDatabaseConnection()
    const conn2 = container.getOrCreateDatabaseConnection()
    expect(conn1).toBe(conn2)
  })

  it('should create repository', () => {
    container = new DIContainer(TEST_CONFIG)
    const repository = container.createRepository()
    expect(repository).toBeTruthy()
  })

  it('should reuse the same repository instance', () => {
    container = new DIContainer(TEST_CONFIG)
    const repo1 = container.createRepository()
    const repo2 = container.createRepository()
    expect(repo1).toBe(repo2)
  })

  it('should create LLM service', () => {
    container = new DIContainer(TEST_CONFIG)
    const service = container.createLLMService()
    expect(service).toBeTruthy()
  })

  it('should reuse the same LLM service instance', () => {
    container = new DIContainer(TEST_CONFIG)
    const svc1 = container.createLLMService()
    const svc2 = container.createLLMService()
    expect(svc1).toBe(svc2)
  })

  it('should create all use cases', () => {
    container = new DIContainer(TEST_CONFIG)
    expect(container.createAddIdeaUseCase()).toBeInstanceOf(AddIdeaUseCase)
    expect(container.createAppendChunkUseCase()).toBeInstanceOf(AppendChunkUseCase)
    expect(container.createListIdeasUseCase()).toBeInstanceOf(ListIdeasUseCase)
    expect(container.createShowIdeaUseCase()).toBeInstanceOf(ShowIdeaUseCase)
    expect(container.createAnalyzeIdeaUseCase()).toBeInstanceOf(AnalyzeIdeaUseCase)
    expect(container.createSuggestActionUseCase()).toBeInstanceOf(SuggestActionUseCase)
    expect(container.createAddTagUseCase()).toBeInstanceOf(AddTagUseCase)
    expect(container.createRemoveTagUseCase()).toBeInstanceOf(RemoveTagUseCase)
    expect(container.createArchiveIdeaUseCase()).toBeInstanceOf(ArchiveIdeaUseCase)
    expect(container.createRestoreIdeaUseCase()).toBeInstanceOf(RestoreIdeaUseCase)
  })

  it('should create all API facades', () => {
    container = new DIContainer(TEST_CONFIG)
    expect(container.createCommandAPI()).toBeInstanceOf(IdeaCommandAPI)
    expect(container.createQueryAPI()).toBeInstanceOf(IdeaQueryAPI)
    expect(container.createAnalysisAPI()).toBeInstanceOf(IdeaAnalysisAPI)
  })

  it('should create CLI controller', () => {
    container = new DIContainer(TEST_CONFIG)
    expect(container.createCLIController()).toBeInstanceOf(CLIController)
  })

  it('should properly clean up on close', () => {
    container = new DIContainer(TEST_CONFIG)
    container.getOrCreateDatabaseConnection()
    container.createRepository()
    container.createLLMService()

    container.close()

    // After close, creating new connection should give a fresh one
    const newConnection = container.getOrCreateDatabaseConnection()
    expect(newConnection).toBeTruthy()
  })
})
