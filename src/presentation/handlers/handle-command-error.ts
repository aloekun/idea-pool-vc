import type { Logger } from '../logger.js'
import { ValidationError } from '../../domain/index.js'

export function handleCommandError(error: unknown, logger: Logger): void {
  if (error instanceof ValidationError) {
    logger.error(`Error: ${error.message}`)
  } else {
    logger.error('Error: An unexpected error occurred.')
  }
}
