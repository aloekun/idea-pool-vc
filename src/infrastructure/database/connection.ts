import Database from 'better-sqlite3'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { ALL_SCHEMAS } from './schema.js'

export class DatabaseConnection {
  private db: Database.Database | null = null

  constructor(private readonly dbPath: string) {}

  connect(): Database.Database {
    if (this.db) {
      return this.db
    }

    const dir = path.dirname(this.dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    this.db = new Database(this.dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')

    return this.db
  }

  initialize(): void {
    const db = this.connect()

    for (const schema of ALL_SCHEMAS) {
      db.exec(schema)
    }
  }

  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db
  }

  static createInMemory(): DatabaseConnection {
    const connection = new DatabaseConnection(':memory:')
    connection.connect()
    connection.initialize()
    return connection
  }
}
