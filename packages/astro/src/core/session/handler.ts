import type { FetchState } from '../app/fetch-state.js';
import { PERSIST_SYMBOL } from './runtime.js';

/**
 * Persists any session mutations made during the request. No-op if
 * sessions are not configured or no mutations occurred.
 *
 * Should be called after the response is produced, typically in a
 * `finally` block to guarantee persistence even when errors occur.
 */
export async function finalizeSessions(state: FetchState): Promise<void> {
	await state.renderContext?.session?.[PERSIST_SYMBOL]();
}
