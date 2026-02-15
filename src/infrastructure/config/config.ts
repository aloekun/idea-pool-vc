import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { config as loadEnv } from 'dotenv'

export interface LLMConfig {
  provider: string
  baseUrl: string
  model: string
}

export interface DatabaseConfig {
  path: string
}

export interface ListConfig {
  defaultLimit: number
}

export interface AppConfig {
  llm: LLMConfig
  database: DatabaseConfig
  list: ListConfig
}

const DEFAULT_CONFIG: AppConfig = {
  llm: {
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  },
  database: {
    path: '.idea-pool/ideas.db',
  },
  list: {
    defaultLimit: 10,
  },
}

function findConfigFile(): string | null {
  const localConfig = path.join(process.cwd(), '.idea-pool', 'config.json')
  if (fs.existsSync(localConfig)) {
    return localConfig
  }

  const homeConfig = path.join(os.homedir(), '.idea-pool', 'config.json')
  if (fs.existsSync(homeConfig)) {
    return homeConfig
  }

  return null
}

function loadConfigFile(): Partial<AppConfig> {
  const configPath = findConfigFile()
  if (!configPath) {
    return {}
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(content) as Partial<AppConfig>
  } catch {
    return {}
  }
}

function applyEnvironmentOverrides(config: AppConfig): AppConfig {
  loadEnv()

  const result = { ...config }

  if (process.env.IDEA_POOL_LLM_PROVIDER) {
    result.llm = { ...result.llm, provider: process.env.IDEA_POOL_LLM_PROVIDER }
  }
  if (process.env.IDEA_POOL_LLM_BASE_URL) {
    result.llm = { ...result.llm, baseUrl: process.env.IDEA_POOL_LLM_BASE_URL }
  }
  if (process.env.IDEA_POOL_LLM_MODEL) {
    result.llm = { ...result.llm, model: process.env.IDEA_POOL_LLM_MODEL }
  }
  if (process.env.IDEA_POOL_DB_PATH) {
    result.database = { ...result.database, path: process.env.IDEA_POOL_DB_PATH }
  }
  if (process.env.IDEA_POOL_LIST_DEFAULT_LIMIT) {
    const limit = parseInt(process.env.IDEA_POOL_LIST_DEFAULT_LIMIT, 10)
    if (!isNaN(limit)) {
      result.list = { ...result.list, defaultLimit: limit }
    }
  }

  return result
}

function mergeConfig(
  defaults: AppConfig,
  fileConfig: Partial<AppConfig>
): AppConfig {
  return {
    llm: {
      ...defaults.llm,
      ...fileConfig.llm,
    },
    database: {
      ...defaults.database,
      ...fileConfig.database,
    },
    list: {
      ...defaults.list,
      ...fileConfig.list,
    },
  }
}

export function loadConfig(): AppConfig {
  const fileConfig = loadConfigFile()
  const merged = mergeConfig(DEFAULT_CONFIG, fileConfig)
  return applyEnvironmentOverrides(merged)
}

export function getAbsoluteDatabasePath(config: AppConfig): string {
  const dbPath = config.database.path
  if (path.isAbsolute(dbPath)) {
    return dbPath
  }
  return path.join(process.cwd(), dbPath)
}
