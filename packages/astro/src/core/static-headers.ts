import type { Logger } from './logger/core.js';

export class StaticHeaders {
	#staticHeaders: Record<string, string> = {};
	#shouldTrack: boolean = false;
	readonly #logger: Logger;
	constructor(shouldTrack = false, logger: Logger) {
		this.#shouldTrack = shouldTrack;
		this.#logger = logger;
	}

	setTracking(shouldTrack: boolean) {
		this.#shouldTrack = shouldTrack;
	}

	/**
	 * Adds a new header to the list of static headers
	 * @param key
	 * @param value
	 */
	public set(key: string, value: string) {
		if (this.#shouldTrack) {
			this.#staticHeaders[key] = value;
		} else {
			this.#logger.warn(
				'adapter',
				`Could not save the header "${key}" for one of the following reasons: \n\t- The adapter doesn't support static headers, \n\t- or the page isn't static.`,
			);
		}
	}

	clear(): void {
		this.#staticHeaders = {};
	}

	dump() {
		return Object.entries(this.#staticHeaders);
	}
}
