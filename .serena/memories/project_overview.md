# Project Overview

## Purpose

**idea-pool-vc** is a CLI tool for accumulating and classifying software ideas using LLM (Ollama/llama3.2).

### Key Features
- Register and manage software ideas
- Automatic tagging and classification via LLM
- Suggest action guidelines for ideas
- Persistent storage in SQLite

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript (Node.js 18+) |
| Package Manager | pnpm |
| Build Tool | tsup |
| Testing | Vitest + fast-check |
| Database | SQLite (better-sqlite3) |
| CLI Parser | Commander.js |
| LLM | Ollama (llama3.2) |
| ID Generation | ULID |

## Architecture

Onion Architecture with 4 layers:

```
Presentation Layer (CLI/Web)
    ↓
Infrastructure Layer (DB, LLM, File System)
    ↓
Application Layer (Use Cases)
    ↓
Domain Layer (Entities, Value Objects)
```

### Layer Responsibilities

- **Domain Layer**: Core business logic, entities, value objects (no external dependencies)
- **Application Layer**: Use cases, orchestration
- **Infrastructure Layer**: Database, LLM service, external integrations
- **Presentation Layer**: CLI commands, user interaction

## Directory Structure

```
src/
├── application/           # Use cases, DTOs
│   ├── dto/              # Data transfer objects
│   └── use-cases/        # Application use cases
├── domain/               # Core business logic
│   ├── entities/         # Idea, Chunk, Tag, Analysis, Suggestion
│   ├── errors/           # Domain errors
│   ├── interfaces/       # Repository and service interfaces
│   └── value-objects/    # IdeaId, ChunkId, AnalysisId, TagCategory
├── infrastructure/       # External services
│   ├── config/           # Configuration
│   ├── database/         # SQLite repository implementation
│   ├── llm/              # Ollama LLM service
│   └── testing/          # Mock implementations
├── presentation/         # User interface
│   └── cli/              # CLI commands
└── shared/               # Shared utilities (Result type)
```

## CLI Commands

```bash
pnpm run idea add <text>        # Register new idea
pnpm run idea list              # List ideas (default 10)
pnpm run idea show <id>         # Show idea details
pnpm run idea analyze <id>      # Generate tags via LLM
pnpm run idea suggest <id>      # Suggest action guidelines
pnpm run idea archive <id>      # Archive idea
```
