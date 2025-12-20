/**
 * Shared types for database mutation operations
 */

export interface MutationResult<T = void> {
  data: T | null;
  error: Error | null;
}

export interface MutationError {
  message: string;
  code?: string;
}
