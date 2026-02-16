# Code Style and Conventions

## TypeScript Configuration

- Target: ES2022
- Module: ESNext with bundler resolution
- Strict mode enabled
- No unused locals/parameters
- No implicit returns
- No fallthrough in switch cases

## Code Style Rules

### Immutability (CRITICAL)

Always use immutable patterns:

```typescript
// CORRECT: Return new object
addChunk(content: string): Idea {
  return new Idea({
    ...this.toProps(),
    chunks: [...this.chunks, chunk],
  })
}

// Use Object.freeze for collections
this.chunks = Object.freeze([...props.chunks])
Object.freeze(this)

// Use readonly for properties
readonly chunks: readonly Chunk[]
```

### Entity Pattern

Use private constructor with static factory methods:

```typescript
class Entity {
  private constructor(props: EntityProps) {
    // Initialize properties
    Object.freeze(this)
  }

  static create(params: CreateParams): Entity {
    // Validation logic
    return new Entity(props)
  }

  static reconstruct(props: EntityProps): Entity {
    return new Entity(props)
  }
}
```

### Result Pattern

Use Result type for error handling instead of exceptions:

```typescript
import { Result, success, failure } from '../shared/result.js'

function operation(): Result<Data, Error> {
  if (failed) {
    return failure(new Error('message'))
  }
  return success(data)
}
```

### Naming Conventions

- Classes: PascalCase (e.g., `IdeaRepository`)
- Functions/Methods: camelCase (e.g., `createIdea`)
- Files: kebab-case (e.g., `idea-repository.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_LIMIT`)
- Types/Interfaces: PascalCase (e.g., `IdeaProps`)

### Import Order

1. Node.js built-in modules
2. External packages
3. Internal modules (relative imports)

```typescript
import { something } from 'node:fs'
import { Command } from 'commander'
import { Idea } from '../domain/entities/index.js'
```

### ESLint Rules

- No unused vars (prefix with `_` if intentionally unused)
- No explicit `any` type
- No console.log (only `console.warn` and `console.error` allowed)

### File Extension in Imports

Always use `.js` extension in imports (for ESM compatibility):

```typescript
import { IdeaId } from '../value-objects/index.js'
```

### File Size Guidelines

- 200-400 lines typical
- 800 lines maximum
- Extract utilities when files grow too large
