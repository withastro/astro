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
