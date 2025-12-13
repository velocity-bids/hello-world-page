// Standardized query result type for consistent error handling
export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

export interface QueryListResult<T> {
  data: T[];
  error: Error | null;
}
