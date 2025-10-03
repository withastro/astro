// @ts-check

export function createSpyStorage() {
	/** @type {Map<string, any>} */
	const store = new Map();
	/** @type {import('unstorage').Storage} */
	// @ts-expect-error
	const storage = {
		/**
		 * @param {string} key
		 * @returns {Promise<any | null>}
		 */
		getItem: async (key) => {
			return store.get(key) ?? null;
		},
		/**
		 * @param {string} key
		 * @returns {Promise<any | null>}
		 */
		getItemRaw: async (key) => {
			return store.get(key) ?? null;
		},
		/**
		 * @param {string} key
		 * @param {any} value
		 * @returns {Promise<void>}
		 */
		setItemRaw: async (key, value) => {
			store.set(key, value);
		},
		/**
		 * @param {string} key
		 * @param {any} value
		 * @returns {Promise<void>}
		 */
		setItem: async (key, value) => {
			store.set(key, value);
		},
	};

	return { storage, store };
}

/** @type {import('../../../../dist/assets/fonts/definitions').ErrorHandler} */
export const simpleErrorHandler = {
	handle(input) {
		return new Error(input.type, { cause: input.cause });
	},
};

/** @type {import('../../../../dist/assets/fonts/definitions').Hasher} */
export const fakeHasher = {
	hashString: (input) => input,
	hashObject: (input) => JSON.stringify(input),
};

export function createSpyUrlProxy() {
	/** @type {Array<Parameters<import('../../../../dist/assets/fonts/definitions').UrlProxy['proxy']>[0]>} */
	const collected = [];
	/** @type {import('../../../../dist/assets/fonts/definitions').UrlProxy} */
	const urlProxy = {
		proxy(input) {
			collected.push(input);
			return input.url;
		},
	};
	return { collected, urlProxy };
}

/** @type {import('../../../../dist/assets/fonts/definitions').FontMetricsResolver} */
export const fakeFontMetricsResolver = {
	async getMetrics() {
		return {
			ascent: 0,
			descent: 0,
			lineGap: 0,
			unitsPerEm: 0,
			xWidthAvg: 0,
		};
	},
	generateFontFace(input) {
		return JSON.stringify(input, null, 2) + `,`;
	},
};

export function createSpyLogger() {
	/** @type {Array<{ type: string; label: string | null; message: string }>} */
	const logs = [];

	/** @type {import('../../../../dist/core/logger/core').Logger} */
	const logger = {
		debug: (label, ...messages) => {
			logs.push(...messages.map((message) => ({ type: 'debug', label, message })));
		},
		error: (label, message) => {
			logs.push({ type: 'error', label, message });
		},
		info: (label, message) => {
			logs.push({ type: 'info', label, message });
		},
		warn: (label, message) => {
			logs.push({ type: 'warn', label, message });
		},
	};
	return {
		logs,
		logger,
	};
}

/**
 * @param {string} input
 */
export function markdownBold(input) {
	return `**${input}**`;
}
