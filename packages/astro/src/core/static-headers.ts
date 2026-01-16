export class StaticHeaders {
	#staticHeaders: Record<string, string> = {};

	/**
	 * Adds a new header to the list of static headers
	 * @param key
	 * @param value
	 */
	public set(key: string, value: string) {
		this.#staticHeaders[key] = value;
	}

	dump() {
		return Object.entries(this.#staticHeaders);
	}
}
