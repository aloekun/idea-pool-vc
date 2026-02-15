// Database
export { DatabaseConnection, SQLiteIdeaRepository } from './database/index.js'

// LLM
export { OllamaLLMService } from './llm/index.js'

// Config
export { loadConfig, getAbsoluteDatabasePath } from './config/index.js'
export type { AppConfig, LLMConfig, DatabaseConfig, ListConfig } from './config/index.js'

// Testing
export { MockIdeaRepository, MockLLMService } from './testing/index.js'
export type { MockLLMServiceOptions } from './testing/index.js'
