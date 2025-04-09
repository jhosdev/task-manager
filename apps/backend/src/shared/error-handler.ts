import { Logger } from 'pino'; // Assuming you use pino, adjust if needed

/**
 * Handles caught errors, logs them appropriately, and throws a new standardized error.
 *
 * @param logger - The logger instance to use.
 * @param error - The caught error object (can be of unknown type).
 * @param context - Additional context for logging (e.g., operationId, method, userId).
 * @param messagePrefix - A prefix for the message of the re-thrown error.
 */
export function handleAndThrowError(
  logger: Logger,
  error: unknown,
  context: Record<string, any>,
  messagePrefix: string
): never { // 'never' indicates this function always throws
  let errorMessage: string;
  let errorStack: string | undefined;

  if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack;
    logger.error(
      { ...context, error: errorMessage, stack: errorStack },
      `${messagePrefix}: ${errorMessage}`
    );
  } else {
    // Handle cases where the caught object is not an Error instance
    errorMessage = String(error);
    logger.error(
      { ...context, error: errorMessage },
      `${messagePrefix}: Non-Error object caught.`
    );
  }

  // Re-throw a new Error to standardize upstream error handling
  throw new Error(`${messagePrefix}: ${errorMessage}`);
}