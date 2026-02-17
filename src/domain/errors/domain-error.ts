export abstract class DomainError extends Error {
  abstract readonly code: string

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR'

  constructor(message: string) {
    super(message)
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND'

  constructor(
    message: string,
    readonly resourceId: string
  ) {
    super(message)
  }
}

export class LLMServiceError extends DomainError {
  readonly code = 'LLM_SERVICE_ERROR'

  constructor(message: string) {
    super(message)
  }
}

export class DatabaseError extends DomainError {
  readonly code = 'DATABASE_ERROR'

  constructor(message: string) {
    super(message)
  }
}

export class UnexpectedError extends DomainError {
  readonly code = 'UNEXPECTED_ERROR'

  constructor(message: string) {
    super(message)
  }
}
