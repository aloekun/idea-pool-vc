export interface APIError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type APIResponse<T> =
  | { success: true; data: T }
  | { success: false; error: APIError }

export function createSuccessResponse<T>(data: T): APIResponse<T> {
  return { success: true, data }
}

export function createErrorResponse<T>(error: APIError): APIResponse<T> {
  return { success: false, error }
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  LLM_SERVICE_ERROR: 'LLM_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
