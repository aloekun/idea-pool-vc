export const CREATE_IDEAS_TABLE = `
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  archived_at TEXT DEFAULT NULL
)
`

export const CREATE_CHUNKS_TABLE = `
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE
)
`

export const CREATE_TAGS_TABLE = `
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
  UNIQUE(idea_id, name, category)
)
`

export const CREATE_ANALYSES_TABLE = `
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  suggestion_content TEXT,
  suggestion_reasoning TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE
)
`

export const CREATE_ANALYSIS_TAGS_TABLE = `
CREATE TABLE IF NOT EXISTS analysis_tags (
  analysis_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  tag_category TEXT NOT NULL,
  PRIMARY KEY (analysis_id, tag_name),
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
)
`

export const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_chunks_idea_id ON chunks(idea_id);
CREATE INDEX IF NOT EXISTS idx_tags_idea_id ON tags(idea_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_analyses_idea_id ON analyses(idea_id);
CREATE INDEX IF NOT EXISTS idx_ideas_archived_at ON ideas(archived_at);
`

export const ALL_SCHEMAS = [
  CREATE_IDEAS_TABLE,
  CREATE_CHUNKS_TABLE,
  CREATE_TAGS_TABLE,
  CREATE_ANALYSES_TABLE,
  CREATE_ANALYSIS_TAGS_TABLE,
  CREATE_INDEXES,
]
