import type { Failure } from './result.js'
import { failure } from './result.js'
import {
  DomainError,
  LLMServiceError,
  DatabaseError,
  UnexpectedError,
} from '../domain/index.js'

export function handleUseCaseError(error: unknown): Failure<DomainError> {
  if (error instanceof LLMServiceError) {
    return failure(error)
  }
  if (error instanceof DatabaseError) {
    return failure(error)
  }
  if (error instanceof DomainError) {
    return failure(error)
  }
  return failure(
    new UnexpectedError(
      error instanceof Error ? error.message : 'Unexpected error occurred'
    )
  )
}
