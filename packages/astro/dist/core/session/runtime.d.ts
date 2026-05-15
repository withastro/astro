import type { RuntimeMode } from '../../types/public/config.js';
import type { AstroCookies } from '../cookies/cookies.js';
import type { SessionDriverFactory } from './types.js';
import type { SSRManifestSession } from '../app/types.js';
import { type Storage } from 'unstorage';
export declare const PERSIST_SYMBOL: unique symbol;
export declare class AstroSession {
	#private;
	constructor({
		cookies,
		config,
		runtimeMode,
		driverFactory,
		mockStorage,
	}: {
		cookies: AstroCookies;
		config: SSRManifestSession | undefined;
		runtimeMode: RuntimeMode;
		driverFactory: SessionDriverFactory | null;
		mockStorage: Storage | null;
	});
	/**
	 * Gets a session value. Returns `undefined` if the session or value does not exist.
	 */
	get<T = void, K extends string = keyof App.SessionData | (string & {})>(
		key: K,
	): Promise<
		(T extends void ? (K extends keyof App.SessionData ? App.SessionData[K] : any) : T) | undefined
	>;
	/**
	 * Checks if a session value exists.
	 */
	has(key: string): Promise<boolean>;
	/**
	 * Gets all session values.
	 */
	keys(): Promise<MapIterator<string>>;
	/**
	 * Gets all session values.
	 */
	values(): Promise<any[]>;
	/**
	 * Gets all session entries.
	 */
	entries(): Promise<any[][]>;
	/**
	 * Deletes a session value.
	 */
	delete(key: string): void;
	/**
	 * Sets a session value. The session is created if it does not exist.
	 */
	set<T = void, K extends string = keyof App.SessionData | (string & {})>(
		key: K,
		value: T extends void
			? K extends keyof App.SessionData
				? App.SessionData[K]
				: any
			: NoInfer<T>,
		{
			ttl,
		}?: {
			ttl?: number;
		},
	): void;
	/**
	 * Destroys the session, clearing the cookie and storage if it exists.
	 */
	destroy(): void;
	/**
	 * Regenerates the session, creating a new session ID. The existing session data is preserved.
	 */
	regenerate(): Promise<void>;
	[PERSIST_SYMBOL](): Promise<void>;
	get sessionID(): string | undefined;
	/**
	 * Loads a session from storage with the given ID, and replaces the current session.
	 * Any changes made to the current session will be lost.
	 * This is not normally needed, as the session is automatically loaded using the cookie.
	 * However it can be used to restore a session where the ID has been recorded somewhere
	 * else (e.g. in a database).
	 */
	load(sessionID: string): Promise<void>;
}
