import type { Layer } from '../layer';

type RateLimitCacheConfig = {
	allowed: number;
	period: 'second' | 'minute' | 'hour';
}

export class RateLimitCache<K extends string = string> implements Layer<K> {
	#cache: Map<string, any> = new Map();
	#counter = 0;
	#start: Date = new Date();
	#milliseconds = 0;
	#allowed: number;
	constructor(cacheConfig: RateLimitCacheConfig) {
		this.#allowed = cacheConfig.allowed;
		switch(cacheConfig.period) {
			case 'second': {
				this.#milliseconds = 1000;
				break;
			}
			case 'minute': {
				this.#milliseconds = 1000 * 60;
				break;
			}
			case 'hour': {
				this.#milliseconds = 1000 * 60 * 60;
				break;
			}
			default: {
				throw new Error(`Unknown rate limit period: ${cacheConfig.period}`);
			}
		}
	}
	get(key: K) {
		if(this.#counter === 0) {
			this.#start = new Date();
		}
		this.#counter++;

		if(this.#cache.has(key)) {
			let now = new Date();

			if(this.#exceedsLimit(now)) {
				return this.#cache.get(key)!;
			} else if(this.#outsidePeriod(now)) {
				this.#counter = 0;
			}
		}
	}
	cache(key: K, value: unknown) {
		this.#cache.set(key, value);
	}
	#millisecondsInPeriod(now: Date): number {
		let diff = (now as any) - (this.#start as any);
		return diff;
	}
	#outsidePeriod(now: Date): boolean {
		return this.#millisecondsInPeriod(now) > this.#milliseconds;
	}
	#exceedsLimit(now: Date): boolean {
		if(this.#outsidePeriod(now)) {
			return false;
		}
		if(this.#counter > this.#allowed) {
			return true;
		}
		return false;
	}
}
