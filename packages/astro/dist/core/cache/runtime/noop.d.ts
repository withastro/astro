import type { CacheLike } from './cache.js';
import type { CacheOptions } from '../types.js';
import type { AstroLogger } from '../../logger/core.js';
export declare class NoopAstroCache implements CacheLike {
	readonly enabled = false;
	set(): void;
	get tags(): string[];
	get options(): Readonly<CacheOptions>;
	invalidate(): Promise<void>;
}
/**
 * A no-op cache used when cache is not configured.
 * Logs a warning on first use instead of throwing, so libraries
 * can call cache methods without needing try/catch.
 * `invalidate()` still throws since it implies the caller
 * expects purging to actually work.
 */
export declare class DisabledAstroCache implements CacheLike {
	#private;
	readonly enabled = false;
	constructor(logger?: AstroLogger);
	set(): void;
	get tags(): string[];
	get options(): Readonly<CacheOptions>;
	invalidate(): Promise<void>;
}
