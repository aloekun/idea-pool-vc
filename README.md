# idea-pool-vc

A CLI tool for accumulating and classifying software ideas using LLM-powered analysis (Ollama/llama3.2).

## Features

- **Idea Management**: Add, list, show, and archive software ideas
- **Chunk Appending**: Attach supplementary notes to existing ideas
- **Tag Management**: Manually add/remove categorized tags (NATURE, SCALE, DIFFICULTY, PHASE, RISK, DOMAIN)
- **LLM Analysis**: Automatically generate tags and action suggestions using Ollama
- **Archive/Restore**: Archive and restore ideas without deletion
- **Persistent Storage**: SQLite-backed data persistence

## Requirements

- Node.js >= 18.0.0
- pnpm
- [Ollama](https://ollama.ai/) (for LLM analysis features)

## Installation

```bash
# Clone the repository
git clone https://github.com/aloekun/idea-pool-vc.git
cd idea-pool-vc

# Install dependencies
pnpm install

# Build the project
pnpm build

# (Optional) Link globally
pnpm link --global
```

## Usage

Run commands using `pnpm run idea` or, if linked globally, use `idea` directly.

### Add an Idea

```bash
pnpm run idea add "Build a task management CLI tool"
```

### List Ideas

```bash
# List active ideas (default: 10 items)
pnpm run idea list

# Limit results
pnpm run idea list --limit 5

# Filter by tag
pnpm run idea list --tag Web

# Show only archived ideas
pnpm run idea list --archived

# Show all ideas including archived
pnpm run idea list --all
```

### Show Idea Details

```bash
pnpm run idea show <id>
```

### Append a Chunk

```bash
pnpm run idea append <id> "Additional notes or thoughts"
```

### Analyze with LLM

Requires a running Ollama instance.

```bash
# Generate tags automatically
pnpm run idea analyze <id>

# Generate action suggestions
pnpm run idea suggest <id>

# Suggest using a specific analysis
pnpm run idea suggest <id> --analysis-id <analysis-id>
```

### Manage Tags

```bash
# Add a tag (categories: NATURE, SCALE, DIFFICULTY, PHASE, RISK, DOMAIN)
pnpm run idea tag add <id> "Web" --category DOMAIN

# Remove a tag
pnpm run idea tag remove <id> "Web"
```

### Archive and Restore

```bash
# Archive an idea
pnpm run idea archive <id>

# Restore an archived idea
pnpm run idea restore <id>
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `idea add <text>` | Register a new idea |
| `idea list [options]` | List ideas with optional filters |
| `idea show <id>` | Show detailed information about an idea |
| `idea append <id> <text>` | Append a chunk to an existing idea |
| `idea analyze <id>` | Analyze an idea with LLM to generate tags |
| `idea suggest <id> [--analysis-id <aid>]` | Generate action suggestions |
| `idea tag add <id> <name> --category <cat>` | Add a categorized tag |
| `idea tag remove <id> <name>` | Remove a tag |
| `idea archive <id>` | Archive an idea |
| `idea restore <id>` | Restore an archived idea |

### List Options

| Option | Description |
|--------|-------------|
| `--limit <n>` | Number of ideas to show (default: 10) |
| `--tag <tag>` | Filter by tag (repeatable) |
| `--archived` | Show only archived ideas |
| `--all` | Show all ideas including archived |

### Tag Categories

| Category | Description |
|----------|-------------|
| `NATURE` | Type of idea (e.g., New, Improvement) |
| `SCALE` | Project scale (e.g., Small, Medium, Large) |
| `DIFFICULTY` | Implementation difficulty |
| `PHASE` | Development phase (e.g., Concept, Development) |
| `RISK` | Risk level |
| `DOMAIN` | Domain area (e.g., Web, Mobile, Finance) |

## Configuration

Configuration is loaded in the following order of precedence:

1. **Environment variables** (highest priority)
2. **Config file** (`~/.idea-pool/config.json` or `.idea-pool/config.json`)
3. **Default values**

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `IDEA_POOL_LLM_PROVIDER` | `ollama` | LLM provider |
| `IDEA_POOL_LLM_BASE_URL` | `http://localhost:11434` | Ollama API base URL |
| `IDEA_POOL_LLM_MODEL` | `llama3.2` | LLM model name |
| `IDEA_POOL_DB_PATH` | `.idea-pool/ideas.db` | SQLite database path |
| `IDEA_POOL_LIST_DEFAULT_LIMIT` | `10` | Default list display limit |

### Config File Example

```json
{
  "llm": {
    "provider": "ollama",
    "baseUrl": "http://localhost:11434",
    "model": "llama3.2"
  },
  "database": {
    "path": ".idea-pool/ideas.db"
  },
  "list": {
    "defaultLimit": 10
  }
}
```

## Development

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build
pnpm build

# Development mode (watch)
pnpm dev
```

## Architecture

The project follows Clean Architecture with four layers:

- **Domain**: Entities, value objects, repository interfaces, domain errors
- **Application**: Use cases, request/response DTOs, API facades
- **Infrastructure**: SQLite repository, Ollama LLM service, DI container, configuration
- **Presentation**: CLI controller, command handlers

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript (Node.js) |
| Package Manager | pnpm |
| Build | tsup |
| Test | Vitest + fast-check |
| Database | SQLite (better-sqlite3) |
| CLI Parser | Commander.js |
| LLM | Ollama (llama3.2) |
| ID Generation | ULID |
| Validation | Zod |

## License

MIT
