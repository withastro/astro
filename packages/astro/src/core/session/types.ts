import type { BuiltinDriverOptions } from 'unstorage';
import type { AstroCookieSetOptions } from '../cookies/cookies.js';

export interface SessionDriver {
	removeItem: (key: string) => Promise<void>;
	getItem: (key: string) => Promise<any>;
	setItem: (key: string, value: any) => Promise<void>;
}

export type SessionDriverFactory = (config: Record<string, any> | undefined) => SessionDriver;

// TODO: test schema matches
export interface SessionDriverConfig {
	/** Driver name, used to identify the driver internally */
	name: string;
	/** Serializable options used by the driver implementation */
	options?: Record<string, any> | undefined;
	/** URL, path relative to the root or package import */
	entrypoint: string | URL;
}

/** @deprecated */
export type SessionDriverName = keyof BuiltinDriverOptions | 'test' | (string & {});

export interface BaseSessionConfig {
	/**
	 * Configures the session cookie. If set to a string, it will be used as the cookie name.
	 * Alternatively, you can pass an object with additional options.
	 */
	cookie?:
		| string
		| (Omit<AstroCookieSetOptions, 'httpOnly' | 'expires' | 'encode'> & {
				name?: string;
		  });

	/**
	 * Default session duration in seconds. If not set, the session will be stored until deleted, or until the cookie expires.
	 */
	ttl?: number;
}

interface DriverConfig<TDriver extends SessionDriverConfig> {
	/** Config object for a custom session driver */
	driver: TDriver;
	/** @deprecated Pass options to the driver function directly. This will be removed in Astro 7 */
	options?: never;
}

interface UnstorageConfig<TDriver extends keyof BuiltinDriverOptions> {
	/**
	 * Entrypoint for an unstorage session driver
	 * @deprecated Use `import { sessionDrivers } from 'astro/config'` instead. This will be removed in Astro 7
	 */
	driver: TDriver;
	/**
	 * Options for the unstorage driver
	 * @deprecated Use `import { sessionDrivers } from 'astro/config'` instead. This will be removed in Astro 7
	 */
	options?: BuiltinDriverOptions[TDriver];
}

interface CustomConfig {
	/**
	 * Entrypoint for a custom session driver
	 * @deprecated Use the object shape (type `SessionDriverConfig`). This will be removed in Astro 7
	 */
	driver?: string;
	/**
	 * Options for the custom session driver
	 * @deprecated Use the object shape (type `SessionDriverConfig`). This will be removed in Astro 7
	 */
	options?: Record<string, unknown>;
}

export type SessionConfig<TDriver extends SessionDriverName | SessionDriverConfig> =
	BaseSessionConfig &
		// If no session.driver is provided, default to the new shape
		[TDriver] extends [never]
		? DriverConfig<SessionDriverConfig>
		: // New shape
			TDriver extends SessionDriverConfig
			? DriverConfig<TDriver>
			: // Legacy shape
				TDriver extends keyof BuiltinDriverOptions
				? UnstorageConfig<TDriver>
				: CustomConfig;
