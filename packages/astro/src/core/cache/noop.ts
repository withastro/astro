import type { CacheHint, CacheOptions, InvalidateOptions, LiveDataEntry } from './types.js';

/**
 * A no-op cache implementation used in dev mode.
 * The API is available so user code doesn't need conditional checks,
 * but nothing is actually cached.
 */
export class NoopAstroCache {
	set(_input: CacheOptions | CacheHint | LiveDataEntry | false): void {}

	get tags(): string[] {
		return [];
	}

	async invalidate(_input: InvalidateOptions | LiveDataEntry): Promise<void> {}

	_applyHeaders(_response: Response): void {}

	get _isActive(): boolean {
		return false;
	}
}
