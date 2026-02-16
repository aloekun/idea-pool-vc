# Suggested Commands

## Development Commands

```bash
# Build
pnpm run build          # Build the project
pnpm run dev            # Watch mode for development

# Testing
pnpm run test           # Run all tests
pnpm run test:watch     # Run tests in watch mode
pnpm run test:coverage  # Run tests with coverage report

# Code Quality
pnpm run lint           # Run ESLint
pnpm run typecheck      # Run TypeScript type checking

# CLI Tool
pnpm run idea <command> # Run CLI commands
```

## System Commands (Windows)

```bash
# Git
git status              # Check repository status
git add <file>          # Stage changes
git commit -m "msg"     # Commit changes
git push                # Push to remote
git pull                # Pull from remote
git diff                # Show unstaged changes
git log --oneline -10   # Show recent commits

# File System
dir                     # List directory contents (Windows)
ls                      # List directory (Git Bash/PowerShell)
cd <path>               # Change directory
type <file>             # Display file contents (Windows cmd)
cat <file>              # Display file contents (Git Bash/PowerShell)

# Search
findstr /s /i "text" *.ts   # Search in files (Windows cmd)
grep -r "text" src/         # Search in files (Git Bash)

# Package Management
pnpm install            # Install dependencies
pnpm add <package>      # Add a dependency
pnpm add -D <package>   # Add a dev dependency
pnpm remove <package>   # Remove a dependency
```

## Useful Shortcuts

```bash
# Quick test single file
pnpm run test -- src/domain/entities/idea.test.ts

# Run specific test by name
pnpm run test -- -t "should create idea"

# Coverage for specific directory
pnpm run test:coverage -- src/domain/

# Typecheck and lint sequentially (lint runs only if typecheck passes)
pnpm run typecheck && pnpm run lint
```
