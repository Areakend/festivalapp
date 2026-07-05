/**
 * supabase-js's FunctionsHttpError message is always the generic
 * "Edge Function returned a non-2xx status code" — the actual reason the
 * function rejected the request is in the response body on error.context.
 */
export async function functionsErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: Response }).context;
  if (context) {
    try {
      const body = await context.clone().json();
      if (typeof body?.error === 'string') return body.error;
    } catch {
      // fall through to the generic message below
    }
  }
  return error instanceof Error ? error.message : String(error);
}
