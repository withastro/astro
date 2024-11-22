import { stringify, unflatten } from 'devalue';
import { type Driver, type Storage, builtinDrivers, createStorage } from 'unstorage';
import type { SessionConfig, SessionDriverName } from '../types/public/config.js';
import type { AstroCookies } from './cookies/cookies.js';
import type { AstroCookieSetOptions } from './cookies/cookies.js';
import { SessionStorageInitError, SessionStorageSaveError } from './errors/errors-data.js';
import { AstroError } from './errors/index.js';

export const PERSIST_SYMBOL = Symbol();

const DEFAULT_COOKIE_NAME = 'astro-session';
const VALID_COOKIE_REGEX = /^[\w-]+$/;

export class AstroSession<TDriver extends SessionDriverName = any> {
	// The cookies object.
	#cookies: AstroCookies;
	// The session configuration.
	#config: Omit<SessionConfig<TDriver>, 'cookie'>;
	// The cookie config
	#cookieConfig?: AstroCookieSetOptions;
	// The cookie name
	#cookieName: string;
	// The unstorage object for the session driver.
	#storage: Storage | undefined;
	#data: Map<string, any> | undefined;
	// The session ID. A v4 UUID.
	#sessionID: string | undefined;
	// Sessions to destroy. Needed because we won't have the old session ID after it's destroyed locally.
	#toDestroy = new Set<string>();
	// Session keys to delete. Used for sparse data sets to avoid overwriting the deleted value.
	#toDelete = new Set<string>();
	// Whether the session is dirty and needs to be saved.
	#dirty = false;
	// Whether the session cookie has been set.
	#cookieSet = false;
	// Whether the session data is sparse and needs to be merged with the existing data.
	#sparse = true;

	constructor(
		cookies: AstroCookies,
		{
			cookie: cookieConfig = DEFAULT_COOKIE_NAME,
			...config
		}: Exclude<SessionConfig<TDriver>, undefined>,
	) {
		this.#cookies = cookies;
		if (typeof cookieConfig === 'object') {
			this.#cookieConfig = cookieConfig;
			this.#cookieName = cookieConfig.name || DEFAULT_COOKIE_NAME;
		} else {
			this.#cookieName = cookieConfig || DEFAULT_COOKIE_NAME;
		}
		this.#config = config;
	}

	/**
	 * Gets a session value. Returns `undefined` if the session or value does not exist.
	 */
	async get<T = any>(key: string): Promise<T | undefined> {
		return (await this.#ensureData()).get(key);
	}

	/**
	 * Checks if a session value exists.
	 */
	async has(key: string): Promise<boolean> {
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
		return (await this.#ensureData()).values();
	}

	/**
	 * Gets all session entries.
	 */
	async entries() {
		return (await this.#ensureData()).entries();
	}

	/**
	 * Deletes a session value.
	 */
	delete(key: string) {
		this.#data?.delete(key);
		if (this.#sparse) {
			this.#toDelete.add(key);
		}
		this.#dirty = true;
	}

	/**
	 * Sets a session value. The session is created if it does not exist.
	 */

	set<T = any>(key: string, value: T) {
		if (!key) {
			throw new AstroError({
				...SessionStorageSaveError,
				message: 'The session key was not provided.',
			});
		}
		try {
			// Attempt to serialize the value so we can throw an error early if needed
			stringify(value);
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
		this.#data ??= new Map();
		this.#data.set(key, value);
		this.#dirty = true;
	}

	/**
	 * Destroys the session, clearing the cookie and storage if it exists.
	 */

	destroy() {
		this.#destroySafe();
	}

	/**
	 * Regenerates the session, creating a new session ID. The existing session data is preserved.
	 */

	async regenerate() {
		let data = new Map();
		try {
			data = await this.#ensureData();
		} catch (err) {
			// Log the error but continue with empty data
			console.error('Failed to load session data during regeneration:', err);
		}

		// Store the old session ID for cleanup
		const oldSessionId = this.#sessionID;

		// Create new session
		this.#sessionID = undefined;
		this.#data = data;
		this.#ensureSessionID();
		await this.#setCookie();

		// Clean up old session asynchronously
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
		// Handle session data persistence

		if (!this.#dirty && !this.#toDestroy.size) {
			return;
		}

		const storage = await this.#ensureStorage();

		if (this.#dirty && this.#data) {
			const data = await this.#ensureData();
			const key = this.#ensureSessionID();
			let serialized;
			try {
				serialized = stringify(data, {
					// Support URL objects
					URL: (val) => val instanceof URL && val.href,
				});
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

		// Handle destroyed session cleanup
		if (this.#toDestroy.size > 0) {
			const cleanupPromises = [...this.#toDestroy].map((sessionId) =>
				storage.removeItem(sessionId).catch((err) => {
					console.error(`Failed to clean up session ${sessionId}:`, err);
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
	 * Sets the session cookie.
	 */
	async #setCookie() {
		if (!VALID_COOKIE_REGEX.test(this.#cookieName)) {
			throw new AstroError({
				...SessionStorageSaveError,
				message: 'Invalid cookie name. Cookie names can only contain letters, numbers, and dashes.',
			});
		}
		const cookieOptions: AstroCookieSetOptions = {
			sameSite: 'lax',
			secure: true,
			path: '/',
			...this.#cookieConfig,
			httpOnly: true,
		};
		const value = this.#ensureSessionID();
		this.#cookies.set(this.#cookieName, value, cookieOptions);
	}

	/**
	 * Attempts to load the session data from storage, or creates a new data object if none exists.
	 * If there is existing sparse data, it will be merged into the new data object.
	 */

	async #ensureData() {
		const storage = await this.#ensureStorage();
		if (this.#data && !this.#sparse) {
			return this.#data;
		}
		this.#data ??= new Map();

		// We stored this as a devalue string, but unstorage will have parsed it as JSON
		const raw = await storage.get<any[]>(this.#ensureSessionID());
		if (!raw) {
			// If there is no existing data in storage we don't need to merge anything
			// and can just return the existing local data.
			return this.#data;
		}

		try {
			const storedMap = unflatten(raw, {
				// Revive URL objects
				URL: (href) => new URL(href),
			});
			if (!(storedMap instanceof Map)) {
				await this.#destroySafe();
				throw new AstroError({
					...SessionStorageInitError,
					message: SessionStorageInitError.message(
						'The session data was an invalid type.',
						this.#config.driver,
					),
				});
			}
			// The local data is "sparse" if it has not been loaded from storage yet. This means
			// it only contains values that have been set or deleted in-memory locally.
			// We do this to avoid the need to block on loading data when it is only being set.
			// When we load the data from storage, we need to merge it with the local sparse data,
			// preserving in-memory changes and deletions.

			if (this.#sparse) {
				// For sparse updates, only copy values from storage that:
				// 1. Don't exist in memory (preserving in-memory changes)
				// 2. Haven't been marked for deletion
				for (const [key, value] of storedMap) {
					if (!this.#data.has(key) && !this.#toDelete.has(key)) {
						this.#data.set(key, value);
					}
				}
			} else {
				this.#data = storedMap;
			}

			this.#sparse = false;
			return this.#data;
		} catch (err) {
			await this.#destroySafe();
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
	 * Safely destroys the session, clearing the cookie and storage if it exists.
	 */
	#destroySafe() {
		if (this.#sessionID) {
			this.#toDestroy.add(this.#sessionID);
		}
		if (this.#cookieName) {
			this.#cookies.delete(this.#cookieName);
		}
		this.#sessionID = undefined;
		this.#data = undefined;
		this.#dirty = true;
	}

	/**
	 * Returns the session ID, generating a new one if it does not exist.
	 */
	#ensureSessionID() {
		this.#sessionID ??= this.#cookies.get(this.#cookieName)?.value ?? crypto.randomUUID();
		return this.#sessionID;
	}

	/**
	 * Ensures the storage is initialized.
	 * This is called automatically when a storage operation is needed.
	 */
	async #ensureStorage(): Promise<Storage> {
		if (this.#storage) {
			return this.#storage;
		}

		if (this.#config.driver === 'test') {
			this.#storage = (this.#config as SessionConfig<'test'>).options.mockStorage;
			return this.#storage;
		}
		if (!this.#config?.driver) {
			throw new AstroError({
				...SessionStorageInitError,
				message: SessionStorageInitError.message(
					'No driver was defined in the session configuration and the adapter did not provide a default driver.',
				),
			});
		}

		let driver: ((config: SessionConfig<TDriver>['options']) => Driver) | null = null;
		const entry =
			this.#config.driver in builtinDrivers
				? `astro/internal/storage/drivers/${this.#config.driver}`
				: this.#config.driver;
		try {
			// Try to load the driver from the built-in unstorage drivers.
			// Otherwise, assume it's a custom driver and load by name.

			driver = await import(entry).then((r) => r.default || r);
		} catch (err: any) {
			// If the driver failed to load, throw an error.
			if (err.code === 'ERR_MODULE_NOT_FOUND') {
				throw new AstroError(
					{
						...SessionStorageInitError,
						message: SessionStorageInitError.message(
							err.message.includes(`Cannot find package '${entry}'`)
								? 'The driver module could not be found.'
								: err.message,
							this.#config.driver,
						),
					},
					{ cause: err },
				);
			}
			throw err;
		}

		if (!driver) {
			throw new AstroError({
				...SessionStorageInitError,
				message: SessionStorageInitError.message(
					'The module did not export a driver.',
					this.#config.driver,
				),
			});
		}

		try {
			this.#storage = createStorage({
				driver: driver(this.#config.options),
			});
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
