import { stringify as rawStringify, unflatten as rawUnflatten } from 'devalue';
import { SessionStorageInitError, SessionStorageSaveError } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { createStorage } from 'unstorage';
const PERSIST_SYMBOL = /* @__PURE__ */ Symbol();
const DEFAULT_COOKIE_NAME = 'astro-session';
const VALID_COOKIE_REGEX = /^[\w-]+$/;
const unflatten = (parsed, _) => {
	return rawUnflatten(parsed, {
		URL: (href) => new URL(href),
	});
};
const stringify = (data, _) => {
	return rawStringify(data, {
		// Support URL objects
		URL: (val) => val instanceof URL && val.href,
	});
};
class AstroSession {
	// The cookies object.
	#cookies;
	// The session configuration.
	#config;
	// The cookie config
	#cookieConfig;
	// The cookie name
	#cookieName;
	// The unstorage object for the session driver.
	#storage;
	#data;
	// The session ID. A v4 UUID.
	#sessionID;
	// Sessions to destroy. Needed because we won't have the old session ID after it's destroyed locally.
	#toDestroy = /* @__PURE__ */ new Set();
	// Session keys to delete. Used for partial data sets to avoid overwriting the deleted value.
	#toDelete = /* @__PURE__ */ new Set();
	// Whether the session is dirty and needs to be saved.
	#dirty = false;
	// Whether the session cookie has been set.
	#cookieSet = false;
	// Whether the session ID was sourced from a client cookie rather than freshly generated.
	#sessionIDFromCookie = false;
	// The local data is "partial" if it has not been loaded from storage yet and only
	// contains values that have been set or deleted in-memory locally.
	// We do this to avoid the need to block on loading data when it is only being set.
	// When we load the data from storage, we need to merge it with the local partial data,
	// preserving in-memory changes and deletions.
	#partial = true;
	// The driver factory function provided by the pipeline
	#driverFactory;
	static #sharedStorage = /* @__PURE__ */ new Map();
	constructor({ cookies, config, runtimeMode, driverFactory, mockStorage }) {
		if (!config) {
			throw new AstroError({
				...SessionStorageInitError,
				message: SessionStorageInitError.message(
					'No driver was defined in the session configuration and the adapter did not provide a default driver.',
				),
			});
		}
		this.#cookies = cookies;
		this.#driverFactory = driverFactory;
		const { cookie: cookieConfig = DEFAULT_COOKIE_NAME, ...configRest } = config;
		let cookieConfigObject;
		if (typeof cookieConfig === 'object') {
			const { name = DEFAULT_COOKIE_NAME, ...rest } = cookieConfig;
			this.#cookieName = name;
			cookieConfigObject = rest;
		} else {
			this.#cookieName = cookieConfig || DEFAULT_COOKIE_NAME;
		}
		this.#cookieConfig = {
			sameSite: 'lax',
			secure: runtimeMode === 'production',
			path: '/',
			...cookieConfigObject,
			httpOnly: true,
		};
		this.#config = configRest;
		if (mockStorage) {
			this.#storage = mockStorage;
		}
	}
	/**
	 * Gets a session value. Returns `undefined` if the session or value does not exist.
	 */
	async get(key) {
		return (await this.#ensureData()).get(key)?.data;
	}
	/**
	 * Checks if a session value exists.
	 */
	async has(key) {
		return (await this.#ensureData()).has(key);
	}
	/**
	 * Gets all session values.
	 */
	async keys() {
		return (await this.#ensureData()).keys();
	}
	/**
	 * Gets all session values.
	 */
	async values() {
		return [...(await this.#ensureData()).values()].map((entry) => entry.data);
	}
	/**
	 * Gets all session entries.
	 */
	async entries() {
		return [...(await this.#ensureData()).entries()].map(([key, entry]) => [key, entry.data]);
	}
	/**
	 * Deletes a session value.
	 */
	delete(key) {
		this.#data ??= /* @__PURE__ */ new Map();
		this.#data.delete(key);
		if (this.#partial) {
			this.#toDelete.add(key);
		}
		this.#dirty = true;
	}
	/**
	 * Sets a session value. The session is created if it does not exist.
	 */
	set(key, value, { ttl } = {}) {
		if (!key) {
			throw new AstroError({
				...SessionStorageSaveError,
				message: 'The session key was not provided.',
			});
		}
		let cloned;
		try {
			cloned = unflatten(JSON.parse(stringify(value)));
		} catch (err) {
			throw new AstroError(
				{
					...SessionStorageSaveError,
					message: `The session data for ${key} could not be serialized.`,
					hint: 'See the devalue library for all supported types: https://github.com/rich-harris/devalue',
				},
				{ cause: err },
			);
		}
		if (!this.#cookieSet) {
			this.#setCookie();
			this.#cookieSet = true;
		}
		this.#data ??= /* @__PURE__ */ new Map();
		const lifetime = ttl ?? this.#config.ttl;
		const expires = typeof lifetime === 'number' ? Date.now() + lifetime * 1e3 : lifetime;
		this.#data.set(key, {
			data: cloned,
			expires,
		});
		this.#dirty = true;
	}
	/**
	 * Destroys the session, clearing the cookie and storage if it exists.
	 */
	destroy() {
		const sessionId = this.#sessionID ?? this.#cookies.get(this.#cookieName)?.value;
		if (sessionId) {
			this.#toDestroy.add(sessionId);
		}
		this.#cookies.delete(this.#cookieName, this.#cookieConfig);
		this.#sessionID = void 0;
		this.#data = void 0;
		this.#dirty = true;
	}
	/**
	 * Regenerates the session, creating a new session ID. The existing session data is preserved.
	 */
	async regenerate() {
		let data = /* @__PURE__ */ new Map();
		try {
			data = await this.#ensureData();
		} catch (err) {
			console.error('Failed to load session data during regeneration:', err);
		}
		const oldSessionId = this.#sessionID;
		this.#sessionID = crypto.randomUUID();
		this.#sessionIDFromCookie = false;
		this.#data = data;
		this.#dirty = true;
		await this.#setCookie();
		if (oldSessionId && this.#storage) {
			this.#storage.removeItem(oldSessionId).catch((err) => {
				console.error('Failed to remove old session data:', err);
			});
		}
	}
	// Persists the session data to storage.
	// This is called automatically at the end of the request.
	// Uses a symbol to prevent users from calling it directly.
	async [PERSIST_SYMBOL]() {
		if (!this.#dirty && !this.#toDestroy.size) {
			return;
		}
		const storage = await this.#ensureStorage();
		if (this.#dirty && this.#data) {
			const data = await this.#ensureData();
			this.#toDelete.forEach((key2) => data.delete(key2));
			const key = this.#ensureSessionID();
			let serialized;
			try {
				serialized = stringify(data);
			} catch (err) {
				throw new AstroError(
					{
						...SessionStorageSaveError,
						message: SessionStorageSaveError.message(
							'The session data could not be serialized.',
							this.#config.driver,
						),
					},
					{ cause: err },
				);
			}
			await storage.setItem(key, serialized);
			this.#dirty = false;
		}
		if (this.#toDestroy.size > 0) {
			const cleanupPromises = [...this.#toDestroy].map((sessionId) =>
				storage.removeItem(sessionId).catch((err) => {
					console.error('Failed to clean up session %s:', sessionId, err);
				}),
			);
			await Promise.all(cleanupPromises);
			this.#toDestroy.clear();
		}
	}
	get sessionID() {
		return this.#sessionID;
	}
	/**
	 * Loads a session from storage with the given ID, and replaces the current session.
	 * Any changes made to the current session will be lost.
	 * This is not normally needed, as the session is automatically loaded using the cookie.
	 * However it can be used to restore a session where the ID has been recorded somewhere
	 * else (e.g. in a database).
	 */
	async load(sessionID) {
		this.#sessionID = sessionID;
		this.#data = void 0;
		await this.#setCookie();
		await this.#ensureData();
	}
	/**
	 * Sets the session cookie.
	 */
	async #setCookie() {
		if (!VALID_COOKIE_REGEX.test(this.#cookieName)) {
			throw new AstroError({
				...SessionStorageSaveError,
				message: 'Invalid cookie name. Cookie names can only contain letters, numbers, and dashes.',
			});
		}
		const value = this.#ensureSessionID();
		this.#cookies.set(this.#cookieName, value, this.#cookieConfig);
	}
	/**
	 * Attempts to load the session data from storage, or creates a new data object if none exists.
	 * If there is existing partial data, it will be merged into the new data object.
	 */
	async #ensureData() {
		if (this.#data && !this.#partial) {
			return this.#data;
		}
		this.#data ??= /* @__PURE__ */ new Map();
		if (!this.#sessionID && !this.#cookies.get(this.#cookieName)?.value) {
			this.#partial = false;
			return this.#data;
		}
		const storage = await this.#ensureStorage();
		const raw = await storage.get(this.#ensureSessionID());
		if (!raw) {
			if (this.#sessionIDFromCookie) {
				this.#sessionID = crypto.randomUUID();
				this.#sessionIDFromCookie = false;
				if (this.#cookieSet) {
					await this.#setCookie();
				}
			}
			return this.#data;
		}
		try {
			const storedMap = unflatten(raw);
			if (!(storedMap instanceof Map)) {
				await this.destroy();
				throw new AstroError({
					...SessionStorageInitError,
					message: SessionStorageInitError.message(
						'The session data was an invalid type.',
						this.#config.driver,
					),
				});
			}
			const now = Date.now();
			for (const [key, value] of storedMap) {
				const expired = typeof value.expires === 'number' && value.expires < now;
				if (!this.#data.has(key) && !this.#toDelete.has(key) && !expired) {
					this.#data.set(key, value);
				}
			}
			this.#partial = false;
			return this.#data;
		} catch (err) {
			await this.destroy();
			if (err instanceof AstroError) {
				throw err;
			}
			throw new AstroError(
				{
					...SessionStorageInitError,
					message: SessionStorageInitError.message(
						'The session data could not be parsed.',
						this.#config.driver,
					),
				},
				{ cause: err },
			);
		}
	}
	/**
	 * Returns the session ID, generating a new one if it does not exist.
	 */
	#ensureSessionID() {
		if (!this.#sessionID) {
			const cookieValue = this.#cookies.get(this.#cookieName)?.value;
			if (cookieValue) {
				this.#sessionID = cookieValue;
				this.#sessionIDFromCookie = true;
			} else {
				this.#sessionID = crypto.randomUUID();
			}
		}
		return this.#sessionID;
	}
	/**
	 * Ensures the storage is initialized.
	 * This is called automatically when a storage operation is needed.
	 */
	async #ensureStorage() {
		if (this.#storage) {
			return this.#storage;
		}
		if (AstroSession.#sharedStorage.has(this.#config.driver)) {
			this.#storage = AstroSession.#sharedStorage.get(this.#config.driver);
			return this.#storage;
		}
		if (!this.#driverFactory) {
			throw new AstroError({
				...SessionStorageInitError,
				message: SessionStorageInitError.message(
					'Astro could not load the driver correctly. Does it exist?',
					this.#config.driver,
				),
			});
		}
		const driver = this.#driverFactory;
		try {
			this.#storage = createStorage({
				driver: {
					...driver(this.#config.options),
					// Unused methods
					hasItem() {
						return false;
					},
					getKeys() {
						return [];
					},
				},
			});
			AstroSession.#sharedStorage.set(this.#config.driver, this.#storage);
			return this.#storage;
		} catch (err) {
			throw new AstroError(
				{
					...SessionStorageInitError,
					message: SessionStorageInitError.message('Unknown error', this.#config.driver),
				},
				{ cause: err },
			);
		}
	}
}
export { AstroSession, PERSIST_SYMBOL };
