# Overview

## Project Overview

**idea-pool-vc** は、ソフトウェアアイデアを永続的に蓄積し、LLM（Ollama/llama3.2）による自動タグ付け・分類・評価を行うCLIツールです。

### 技術スタック

| カテゴリ | 選択 |
|---------|------|
| 言語 | TypeScript (Node.js) |
| パッケージマネージャー | pnpm |
| ビルド | tsup |
| テスト | Vitest + fast-check |
| データベース | SQLite (better-sqlite3) |
| CLIパーサー | Commander.js |
| LLM | Ollama (llama3.2) |
| ID生成 | ULID |

### 主要コマンド

```bash
pnpm run idea add <text>        # アイデア登録
pnpm run idea list              # 一覧表示（デフォルト10件）
pnpm run idea show <id>         # 詳細表示
pnpm run idea analyze <id>      # LLMでタグ生成
pnpm run idea suggest <id>      # LLMで行動指針を提案
pnpm run idea archive <id>      # アーカイブ
```

### 詳細ドキュメント

- [要件定義書](docs/requirements.md)
- [設計書](docs/design.md)
- [タスクリスト](docs/tasks.md)


## Critical Rules

### 1. Communication with users

- Communication with users is conducted in Japanese
- Use AskUserQuestion to ask questions to users
- Discussions regarding design, implementation, and bug fixes will be conducted in English. This is intended to minimize context consumption.

### 2. Code Organization

- Many small files over few large files
- High cohesion, low coupling
- 200-400 lines typical, 800 max per file
- Organize by feature/domain, not by type

### 3. Code Style

- No emojis in code, comments, or documentation
- Immutability always - never mutate objects or arrays
- No console.log in production code
- Proper error handling with try/catch
- Input validation with Zod or similar

### 4. Testing

- TDD: Write tests first
- 80% minimum coverage
- Unit tests for utilities
- Integration tests for APIs
- E2E tests for critical flows

### 5. Security

- No hardcoded secrets
- Environment variables for sensitive data
- Validate all user inputs
- Parameterized queries only
- CSRF protection enabled

## File Structure

```
src/
|-- domain/           # Domain layer (entities, value objects, interfaces)
|   |-- entities/     # Idea, Chunk, Tag, Analysis, Suggestion
|   |-- value-objects/ # IdeaId, ChunkId, AnalysisId, TagCategory
|   |-- interfaces/   # IIdeaRepository, ILLMService
|   |-- errors/       # DomainError, ValidationError, etc.
|-- application/      # Application layer (use cases, DTOs)
|   |-- dto/          # API response types, IdeaDTO
|-- infrastructure/   # Infrastructure layer
|   |-- database/     # SQLite repository, schema, connection
|   |-- llm/          # Ollama LLM service
|   |-- config/       # App configuration
|   |-- testing/      # Mock implementations
|-- shared/           # Shared utilities (Result type)
docs/
|-- design.md         # Architecture and design document
|-- requirements.md   # Requirements specification
|-- tasks.md          # Task list
```

## Key Patterns

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### Error Handling

```typescript
try {
  const result = await operation()
  return { success: true, data: result }
} catch (error) {
  console.error('Operation failed:', error)
  return { success: false, error: 'User-friendly message' }
}
```

## Environment Variables

```bash
# LLM settings
IDEA_POOL_LLM_PROVIDER=ollama
IDEA_POOL_LLM_BASE_URL=http://localhost:11434
IDEA_POOL_LLM_MODEL=llama3.2

# Database
IDEA_POOL_DB_PATH=.idea-pool/ideas.db

# List display
IDEA_POOL_LIST_DEFAULT_LIMIT=10
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Never commit to main directly
- PRs require review
- All tests must pass before merge
