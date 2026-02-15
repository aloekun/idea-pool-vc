import type Database from 'better-sqlite3'
import type { IIdeaRepository, ListIdeasOptions } from '../../domain/interfaces/index.js'
import {
  Idea,
  Tag,
  Chunk,
  Analysis,
  Suggestion,
  IdeaId,
  ChunkId,
  AnalysisId,
  TagCategory,
} from '../../domain/index.js'
import type { DatabaseConnection } from './connection.js'

interface IdeaRow {
  id: string
  content: string
  created_at: string
  archived_at: string | null
}

interface ChunkRow {
  id: string
  idea_id: string
  content: string
  created_at: string
}

interface TagRow {
  idea_id: string
  name: string
  category: string
}

interface AnalysisRow {
  id: string
  idea_id: string
  suggestion_content: string | null
  suggestion_reasoning: string | null
  created_at: string
}

interface AnalysisTagRow {
  analysis_id: string
  tag_name: string
  tag_category: string
}

export class SQLiteIdeaRepository implements IIdeaRepository {
  private readonly db: Database.Database

  constructor(connection: DatabaseConnection) {
    this.db = connection.getDatabase()
  }

  async save(idea: Idea): Promise<void> {
    const insertIdea = this.db.prepare(`
      INSERT INTO ideas (id, content, created_at, archived_at)
      VALUES (?, ?, ?, ?)
    `)

    const insertChunk = this.db.prepare(`
      INSERT INTO chunks (id, idea_id, content, created_at)
      VALUES (?, ?, ?, ?)
    `)

    const insertTag = this.db.prepare(`
      INSERT INTO tags (idea_id, name, category)
      VALUES (?, ?, ?)
    `)

    const insertAnalysis = this.db.prepare(`
      INSERT INTO analyses (id, idea_id, suggestion_content, suggestion_reasoning, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)

    const insertAnalysisTag = this.db.prepare(`
      INSERT INTO analysis_tags (analysis_id, tag_name, tag_category)
      VALUES (?, ?, ?)
    `)

    const transaction = this.db.transaction(() => {
      insertIdea.run(
        idea.id.value,
        idea.content,
        idea.createdAt.toISOString(),
        idea.archivedAt?.toISOString() ?? null
      )

      for (const chunk of idea.chunks) {
        insertChunk.run(
          chunk.id.value,
          idea.id.value,
          chunk.content,
          chunk.createdAt.toISOString()
        )
      }

      for (const tag of idea.tags) {
        insertTag.run(idea.id.value, tag.name, tag.category.value)
      }

      for (const analysis of idea.analyses) {
        insertAnalysis.run(
          analysis.id.value,
          idea.id.value,
          analysis.suggestion?.content ?? null,
          analysis.suggestion?.reasoning ?? null,
          analysis.createdAt.toISOString()
        )

        for (const tag of analysis.generatedTags) {
          insertAnalysisTag.run(analysis.id.value, tag.name, tag.category.value)
        }
      }
    })

    transaction()
  }

  async findById(id: IdeaId): Promise<Idea | null> {
    const ideaRow = this.db
      .prepare('SELECT * FROM ideas WHERE id = ?')
      .get(id.value) as IdeaRow | undefined

    if (!ideaRow) {
      return null
    }

    return this.reconstructIdea(ideaRow)
  }

  async findAll(options?: ListIdeasOptions): Promise<readonly Idea[]> {
    let query = 'SELECT * FROM ideas'
    const params: unknown[] = []

    if (options?.archivedOnly) {
      query += ' WHERE archived_at IS NOT NULL'
    } else if (!options?.includeArchived) {
      query += ' WHERE archived_at IS NULL'
    }

    query += ' ORDER BY created_at DESC'

    if (options?.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)
    }

    const rows = this.db.prepare(query).all(...params) as IdeaRow[]

    const ideas: Idea[] = []
    for (const row of rows) {
      ideas.push(await this.reconstructIdea(row))
    }

    return ideas
  }

  async findAllActive(options?: ListIdeasOptions): Promise<readonly Idea[]> {
    return this.findAll({ ...options, archivedOnly: false, includeArchived: false })
  }

  async findAllArchived(options?: ListIdeasOptions): Promise<readonly Idea[]> {
    return this.findAll({ ...options, archivedOnly: true })
  }

  async findByTags(
    tags: readonly string[],
    options?: ListIdeasOptions
  ): Promise<readonly Idea[]> {
    if (tags.length === 0) {
      return this.findAll(options)
    }

    const placeholders = tags.map(() => '?').join(', ')
    let query = `
      SELECT DISTINCT i.*
      FROM ideas i
      INNER JOIN tags t ON i.id = t.idea_id
      WHERE t.name IN (${placeholders})
    `
    const params: unknown[] = [...tags]

    if (options?.archivedOnly) {
      query += ' AND i.archived_at IS NOT NULL'
    } else if (!options?.includeArchived) {
      query += ' AND i.archived_at IS NULL'
    }

    query += ' GROUP BY i.id HAVING COUNT(DISTINCT t.name) = ?'
    params.push(tags.length)

    query += ' ORDER BY i.created_at DESC'

    if (options?.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)
    }

    const rows = this.db.prepare(query).all(...params) as IdeaRow[]

    const ideas: Idea[] = []
    for (const row of rows) {
      ideas.push(await this.reconstructIdea(row))
    }

    return ideas
  }

  async update(idea: Idea): Promise<void> {
    const updateIdea = this.db.prepare(`
      UPDATE ideas
      SET content = ?, archived_at = ?
      WHERE id = ?
    `)

    const deleteChunks = this.db.prepare('DELETE FROM chunks WHERE idea_id = ?')
    const deleteTags = this.db.prepare('DELETE FROM tags WHERE idea_id = ?')
    const deleteAnalysisTags = this.db.prepare(`
      DELETE FROM analysis_tags
      WHERE analysis_id IN (SELECT id FROM analyses WHERE idea_id = ?)
    `)
    const deleteAnalyses = this.db.prepare('DELETE FROM analyses WHERE idea_id = ?')

    const insertChunk = this.db.prepare(`
      INSERT INTO chunks (id, idea_id, content, created_at)
      VALUES (?, ?, ?, ?)
    `)

    const insertTag = this.db.prepare(`
      INSERT INTO tags (idea_id, name, category)
      VALUES (?, ?, ?)
    `)

    const insertAnalysis = this.db.prepare(`
      INSERT INTO analyses (id, idea_id, suggestion_content, suggestion_reasoning, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)

    const insertAnalysisTag = this.db.prepare(`
      INSERT INTO analysis_tags (analysis_id, tag_name, tag_category)
      VALUES (?, ?, ?)
    `)

    const transaction = this.db.transaction(() => {
      updateIdea.run(
        idea.content,
        idea.archivedAt?.toISOString() ?? null,
        idea.id.value
      )

      deleteChunks.run(idea.id.value)
      deleteTags.run(idea.id.value)
      deleteAnalysisTags.run(idea.id.value)
      deleteAnalyses.run(idea.id.value)

      for (const chunk of idea.chunks) {
        insertChunk.run(
          chunk.id.value,
          idea.id.value,
          chunk.content,
          chunk.createdAt.toISOString()
        )
      }

      for (const tag of idea.tags) {
        insertTag.run(idea.id.value, tag.name, tag.category.value)
      }

      for (const analysis of idea.analyses) {
        insertAnalysis.run(
          analysis.id.value,
          idea.id.value,
          analysis.suggestion?.content ?? null,
          analysis.suggestion?.reasoning ?? null,
          analysis.createdAt.toISOString()
        )

        for (const tag of analysis.generatedTags) {
          insertAnalysisTag.run(analysis.id.value, tag.name, tag.category.value)
        }
      }
    })

    transaction()
  }

  private async reconstructIdea(row: IdeaRow): Promise<Idea> {
    const chunks = this.getChunks(row.id)
    const tags = this.getTags(row.id)
    const analyses = this.getAnalyses(row.id)

    return Idea.reconstruct({
      id: IdeaId.fromString(row.id),
      content: row.content,
      createdAt: new Date(row.created_at),
      archivedAt: row.archived_at ? new Date(row.archived_at) : null,
      chunks,
      tags,
      analyses,
    })
  }

  private getChunks(ideaId: string): readonly Chunk[] {
    const rows = this.db
      .prepare('SELECT * FROM chunks WHERE idea_id = ? ORDER BY created_at ASC')
      .all(ideaId) as ChunkRow[]

    return rows.map((row) =>
      Chunk.reconstruct({
        id: ChunkId.fromString(row.id),
        content: row.content,
        createdAt: new Date(row.created_at),
      })
    )
  }

  private getTags(ideaId: string): readonly Tag[] {
    const rows = this.db
      .prepare('SELECT * FROM tags WHERE idea_id = ?')
      .all(ideaId) as TagRow[]

    return rows.map((row) =>
      Tag.reconstruct(row.name, TagCategory.fromString(row.category))
    )
  }

  private getAnalyses(ideaId: string): readonly Analysis[] {
    const rows = this.db
      .prepare('SELECT * FROM analyses WHERE idea_id = ? ORDER BY created_at ASC')
      .all(ideaId) as AnalysisRow[]

    return rows.map((row) => {
      const analysisTagRows = this.db
        .prepare('SELECT * FROM analysis_tags WHERE analysis_id = ?')
        .all(row.id) as AnalysisTagRow[]

      const generatedTags = analysisTagRows.map((tagRow) =>
        Tag.reconstruct(tagRow.tag_name, TagCategory.fromString(tagRow.tag_category))
      )

      const suggestion =
        row.suggestion_content && row.suggestion_reasoning
          ? Suggestion.reconstruct({
              content: row.suggestion_content,
              reasoning: row.suggestion_reasoning,
            })
          : null

      return Analysis.reconstruct({
        id: AnalysisId.fromString(row.id),
        generatedTags,
        suggestion,
        createdAt: new Date(row.created_at),
      })
    })
  }
}
