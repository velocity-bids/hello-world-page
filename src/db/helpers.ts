import type { QueryResult, QueryListResult } from "./queries/types";
import type { MutationResult } from "./mutations/types";

/**
 * Wraps a Supabase query function, handling the try/catch boilerplate.
 * Returns { data, error: null } on success or { data: null, error } on failure.
 */
export async function withQuery<T>(
  fn: () => PromiseLike<{ data: T | null; error: any }>
): Promise<QueryResult<T>> {
  try {
    const { data, error } = await fn();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Wraps a Supabase query that returns a list.
 * Returns { data: [], error: null } on success or { data: [], error } on failure.
 */
export async function withQueryList<T>(
  fn: () => PromiseLike<{ data: T[] | null; error: any }>
): Promise<QueryListResult<T>> {
  try {
    const { data, error } = await fn();
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Wraps a Supabase mutation function.
 * Returns { data: null, error: null } on success or { data: null, error } on failure.
 */
export async function withMutation<T = void>(
  fn: () => PromiseLike<{ error: any; data?: T | null }>
): Promise<MutationResult<T>> {
  try {
    const { error, data } = await fn();
    if (error) throw error;
    return { data: data ?? null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
