import type { DomainError } from '../../domain/index.js'
import { ValidationError, NotFoundError, LLMServiceError, DatabaseError } from '../../domain/index.js'
import type { APIResponse } from '../dto/api-response.js'
import { ERROR_CODES } from '../dto/api-response.js'

export function convertDomainErrorToAPIError<T>(error: DomainError): APIResponse<T> {
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error.message,
      },
    }
  }

  if (error instanceof NotFoundError) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: error.message,
        details: { resourceId: error.resourceId },
      },
    }
  }

  if (error instanceof LLMServiceError) {
    console.error('LLM service error:', error.message)
    return {
      success: false,
      error: {
        code: ERROR_CODES.LLM_SERVICE_ERROR,
        message: 'LLM service unavailable',
      },
    }
  }

  if (error instanceof DatabaseError) {
    console.error('Database error:', error.message)
    return {
      success: false,
      error: {
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Database error',
      },
    }
  }

  return {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
  }
}
