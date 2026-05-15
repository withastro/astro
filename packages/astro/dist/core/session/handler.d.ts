import type { FetchState } from '../fetch/fetch-state.js';
/**
 * Registers a session provider on the given `FetchState`. When
 * `state.resolve('session')` is first called, the `AstroSession` is
 * created lazily. When `state.finalizeAll()` runs, any mutations are
 * persisted.
 *
 * No-op (returns synchronously) if sessions are not configured on the
 * pipeline, avoiding promise allocation on the hot path.
 */
export declare function provideSession(state: FetchState): Promise<void> | void;
