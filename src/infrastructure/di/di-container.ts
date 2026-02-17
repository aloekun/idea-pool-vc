import type { IIdeaRepository } from '../../domain/interfaces/idea-repository.js'
import type { ILLMService } from '../../domain/interfaces/llm-service.js'
import type { AppConfig } from '../config/config.js'
import { DatabaseConnection } from '../database/connection.js'
import { SQLiteIdeaRepository } from '../database/sqlite-idea-repository.js'
import { OllamaLLMService } from '../llm/ollama-llm-service.js'
import { getAbsoluteDatabasePath } from '../config/config.js'
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
import { IdeaCommandAPI } from '../../application/api/idea-command-api.js'
import { IdeaQueryAPI } from '../../application/api/idea-query-api.js'
import { IdeaAnalysisAPI } from '../../application/api/idea-analysis-api.js'
import { CLIController } from '../../presentation/cli-controller.js'

export class DIContainer {
  private dbConnection: DatabaseConnection | null = null
  private repository: IIdeaRepository | null = null
  private llmService: ILLMService | null = null

  constructor(private readonly config: AppConfig) {}

  getOrCreateDatabaseConnection(): DatabaseConnection {
    if (!this.dbConnection) {
      const dbPath = getAbsoluteDatabasePath(this.config)
      const connection = new DatabaseConnection(dbPath)
      try {
        connection.connect()
        connection.initialize()
        this.dbConnection = connection
      } catch (error) {
        connection.close()
        this.dbConnection = null
        throw error
      }
    }
    return this.dbConnection
  }

  createRepository(): IIdeaRepository {
    if (!this.repository) {
      const connection = this.getOrCreateDatabaseConnection()
      this.repository = new SQLiteIdeaRepository(connection)
    }
    return this.repository
  }

  createLLMService(): ILLMService {
    if (!this.llmService) {
      this.llmService = new OllamaLLMService(
        this.config.llm.baseUrl,
        this.config.llm.model
      )
    }
    return this.llmService
  }

  createAddIdeaUseCase(): AddIdeaUseCase {
    return new AddIdeaUseCase(this.createRepository())
  }

  createAppendChunkUseCase(): AppendChunkUseCase {
    return new AppendChunkUseCase(this.createRepository())
  }

  createListIdeasUseCase(): ListIdeasUseCase {
    return new ListIdeasUseCase(this.createRepository())
  }

  createShowIdeaUseCase(): ShowIdeaUseCase {
    return new ShowIdeaUseCase(this.createRepository())
  }

  createAnalyzeIdeaUseCase(): AnalyzeIdeaUseCase {
    return new AnalyzeIdeaUseCase(this.createRepository(), this.createLLMService())
  }

  createSuggestActionUseCase(): SuggestActionUseCase {
    return new SuggestActionUseCase(this.createRepository(), this.createLLMService())
  }

  createAddTagUseCase(): AddTagUseCase {
    return new AddTagUseCase(this.createRepository())
  }

  createRemoveTagUseCase(): RemoveTagUseCase {
    return new RemoveTagUseCase(this.createRepository())
  }

  createArchiveIdeaUseCase(): ArchiveIdeaUseCase {
    return new ArchiveIdeaUseCase(this.createRepository())
  }

  createRestoreIdeaUseCase(): RestoreIdeaUseCase {
    return new RestoreIdeaUseCase(this.createRepository())
  }

  createCommandAPI(): IdeaCommandAPI {
    return new IdeaCommandAPI(
      this.createAddIdeaUseCase(),
      this.createAppendChunkUseCase(),
      this.createAddTagUseCase(),
      this.createRemoveTagUseCase(),
      this.createArchiveIdeaUseCase(),
      this.createRestoreIdeaUseCase(),
      this.createShowIdeaUseCase()
    )
  }

  createQueryAPI(): IdeaQueryAPI {
    return new IdeaQueryAPI(
      this.createListIdeasUseCase(),
      this.createShowIdeaUseCase()
    )
  }

  createAnalysisAPI(): IdeaAnalysisAPI {
    return new IdeaAnalysisAPI(
      this.createAnalyzeIdeaUseCase(),
      this.createSuggestActionUseCase()
    )
  }

  createCLIController(): CLIController {
    return new CLIController(
      this.createCommandAPI(),
      this.createQueryAPI(),
      this.createAnalysisAPI(),
      this.config.list.defaultLimit
    )
  }

  close(): void {
    if (this.dbConnection) {
      this.dbConnection.close()
      this.dbConnection = null
    }
    this.repository = null
    this.llmService = null
  }
}
