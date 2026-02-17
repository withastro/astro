import { AstroError } from '../errors/errors.js';
import { CacheNotEnabled } from '../errors/errors-data.js';
import type { CacheHint, CacheOptions, InvalidateOptions, LiveDataEntry } from './types.js';

/**
 * A no-op cache implementation used in dev mode when cache is configured.
 * The API is available so user code doesn't need conditional checks,
 * but nothing is actually cached.
 */
const EMPTY_OPTIONS = Object.freeze({ tags: [] }) as Readonly<CacheOptions>;

export class NoopAstroCache {
	set(_input: CacheOptions | CacheHint | LiveDataEntry | false): void {}

	get tags(): string[] {
		return [];
	}

	get options(): Readonly<CacheOptions> {
		return EMPTY_OPTIONS;
	}

	async invalidate(_input: InvalidateOptions | LiveDataEntry): Promise<void> {}
}

/**
 * A cache implementation that throws on any method call.
 * Used when cache is not configured — provides a clear, actionable error
 * instead of silently doing nothing or returning undefined.
 */
class DisabledAstroCacheImpl {
	set(_input: CacheOptions | CacheHint | LiveDataEntry | false): void {
		throw new AstroError(CacheNotEnabled);
	}

	get tags(): string[] {
		throw new AstroError(CacheNotEnabled);
	}

	get options(): Readonly<CacheOptions> {
		throw new AstroError(CacheNotEnabled);
	}

	async invalidate(_input: InvalidateOptions | LiveDataEntry): Promise<void> {
		throw new AstroError(CacheNotEnabled);
	}
}

export type DisabledAstroCache = DisabledAstroCacheImpl;

/** Shared singleton — no per-request allocation when cache is disabled. */
export const disabledAstroCache: DisabledAstroCache = new DisabledAstroCacheImpl();
