# Task Completion Checklist

## Before Marking Task Complete

Run these commands to verify the task is complete:

### 1. Type Check
```bash
pnpm run typecheck
```
Ensure no TypeScript errors.

### 2. Lint
```bash
pnpm run lint
```
Ensure no ESLint errors or warnings.

### 3. Tests
```bash
pnpm run test
```
Ensure all tests pass.

### 4. Coverage (if applicable)
```bash
pnpm run test:coverage
```
Ensure 80% minimum coverage for new code.

### 5. Build
```bash
pnpm run build
```
Ensure the project builds successfully.

## Code Quality Checklist

- [ ] Code follows immutable patterns (no mutations)
- [ ] No `any` types used
- [ ] No `console.log` in production code
- [ ] Proper error handling with Result type or try/catch
- [ ] Input validation at system boundaries
- [ ] Files under 800 lines
- [ ] Functions under 50 lines
- [ ] No deep nesting (>4 levels)

## Git Commit Guidelines

- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Keep commits small and focused
- Test locally before committing
- Never commit to main directly

## TDD Workflow

1. Write test first (RED)
2. Run test - should FAIL
3. Write minimal implementation (GREEN)
4. Run test - should PASS
5. Refactor (IMPROVE)
6. Verify 80%+ coverage
