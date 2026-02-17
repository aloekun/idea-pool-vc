import { vi } from 'vitest'
import { CLIController } from '../../presentation/cli-controller.js'
import { IdeaCommandAPI } from '../../application/api/idea-command-api.js'
import { IdeaQueryAPI } from '../../application/api/idea-query-api.js'
import { IdeaAnalysisAPI } from '../../application/api/idea-analysis-api.js'
import {
  AddIdeaUseCase,
  AppendChunkUseCase,
  ListIdeasUseCase,
  ShowIdeaUseCase,
  AnalyzeIdeaUseCase,
  SuggestActionUseCase,
  AddTagUseCase,
  RemoveTagUseCase,
  ArchiveIdeaUseCase,
  RestoreIdeaUseCase,
} from '../../application/use-cases/index.js'
import { DatabaseConnection } from '../../infrastructure/database/connection.js'
import { SQLiteIdeaRepository } from '../../infrastructure/database/sqlite-idea-repository.js'
import { MockLLMService } from '../../infrastructure/testing/mock-llm-service.js'
import type { MockLLMServiceOptions } from '../../infrastructure/testing/mock-llm-service.js'

export interface E2ETestContext {
  readonly controller: CLIController
  readonly repository: SQLiteIdeaRepository
  readonly llmService: MockLLMService
  readonly connection: DatabaseConnection
  readonly getOutput: () => string
  readonly getErrors: () => string
  readonly clearOutput: () => void
  readonly clearErrors: () => void
  readonly cleanup: () => void
}

export function createE2ETestContext(
  llmOptions?: MockLLMServiceOptions,
  defaultLimit = 10
): E2ETestContext {
  const connection = DatabaseConnection.createInMemory()
  const repository = new SQLiteIdeaRepository(connection)
  const llmService = new MockLLMService(llmOptions)

  const addIdeaUseCase = new AddIdeaUseCase(repository)
  const appendChunkUseCase = new AppendChunkUseCase(repository)
  const listIdeasUseCase = new ListIdeasUseCase(repository)
  const showIdeaUseCase = new ShowIdeaUseCase(repository)
  const analyzeIdeaUseCase = new AnalyzeIdeaUseCase(repository, llmService)
  const suggestActionUseCase = new SuggestActionUseCase(repository, llmService)
  const addTagUseCase = new AddTagUseCase(repository)
  const removeTagUseCase = new RemoveTagUseCase(repository)
  const archiveIdeaUseCase = new ArchiveIdeaUseCase(repository)
  const restoreIdeaUseCase = new RestoreIdeaUseCase(repository)

  const commandAPI = new IdeaCommandAPI(
    addIdeaUseCase,
    appendChunkUseCase,
    addTagUseCase,
    removeTagUseCase,
    archiveIdeaUseCase,
    restoreIdeaUseCase
  )

  const queryAPI = new IdeaQueryAPI(listIdeasUseCase, showIdeaUseCase)

  const analysisAPI = new IdeaAnalysisAPI(
    analyzeIdeaUseCase,
    suggestActionUseCase
  )

  const controller = new CLIController(
    commandAPI,
    queryAPI,
    analysisAPI,
    defaultLimit
  )

  let outputLines: string[] = []
  let errorLines: string[] = []

  const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
    outputLines = [...outputLines, String(str)]
    return true
  })

  const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((str) => {
    errorLines = [...errorLines, String(str)]
    return true
  })

  return {
    controller,
    repository,
    llmService,
    connection,
    getOutput: () => outputLines.join(''),
    getErrors: () => errorLines.join(''),
    clearOutput: () => { outputLines = [] },
    clearErrors: () => { errorLines = [] },
    cleanup: () => {
      stdoutSpy.mockRestore()
      stderrSpy.mockRestore()
      connection.close()
    },
  }
}

export function extractIdeaId(output: string): string {
  const match = output.match(/ID:\s*([A-Z0-9]+)/i)
  if (!match) {
    throw new Error(`Could not extract idea ID from output: ${output}`)
  }
  return match[1]
}

export function extractAnalysisId(output: string): string {
  const match = output.match(/Analysis.*ID:\s*([A-Z0-9]+)/i)
  if (!match) {
    throw new Error(`Could not extract analysis ID from output: ${output}`)
  }
  return match[1]
}

export function runCommand(
  controller: CLIController,
  ...args: string[]
): Promise<void> {
  return controller.run(['node', 'idea', ...args])
}
