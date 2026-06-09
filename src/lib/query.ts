import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js'

export type QueryResult<T> = { data: T; error: null } | { data: null; error: string }

export async function safeQuery<T>(
  promise: Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>>
): Promise<QueryResult<T>> {
  const res = await promise
  if (res.error) return { data: null, error: res.error.message }
  return { data: res.data as T, error: null }
}

export function handleError(error: string, messageApi?: { error: (msg: string) => void }) {
  console.error('[query]', error)
  messageApi?.error(error)
}
