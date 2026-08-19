import type { BuiltinDriverOptions } from 'unstorage';
import type { AstroCookieSetOptions } from '../cookies/cookies.js';

export interface SessionDriver {
	removeItem: (key: string) => Promise<void>;
	getItem: (key: string) => Promise<any>;
	setItem: (key: string, value: any) => Promise<void>;
}

export type SessionDriverFactory = (config: Record<string, any> | undefined) => SessionDriver;

export interface SessionDriverConfig {
	/** Serializable options used by the driver implementation */
	config?: Record<string, any> | undefined;
	/** URL or package import */
	entrypoint: string | URL;
}

export interface NormalizedSessionDriverConfig {
	config: Record<string, any> | undefined;
	entrypoint: string;
}

/** @deprecated */
export type SessionDriverName = keyof BuiltinDriverOptions | (string & {});

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

interface DriverConfig<TDriver extends SessionDriverConfig> extends BaseSessionConfig {
	/** Config object for a session driver */
	driver: TDriver;
	/** @deprecated Pass options to the driver function directly. This will be removed in Astro 7 */
	options?: never;
}

interface UnstorageConfig<
	TDriver extends keyof BuiltinDriverOptions | undefined,
	TOptions = TDriver extends keyof BuiltinDriverOptions
		? NoInfer<BuiltinDriverOptions[TDriver]>
		: undefined,
> extends BaseSessionConfig {
	/**
	 * Entrypoint for an unstorage session driver
	 * @deprecated Use `import { sessionDrivers } from 'astro/config'` instead. This will be removed in Astro 7
	 */
	driver?: TDriver;
	/**
	 * Options for the unstorage driver
	 * @deprecated Use `import { sessionDrivers } from 'astro/config'` instead. This will be removed in Astro 7
	 */
	options?: TOptions;
}

interface CustomConfig extends BaseSessionConfig {
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

export type SessionConfig<TDriver extends SessionDriverName | SessionDriverConfig | undefined> = [
	TDriver,
] extends [never]
	? UnstorageConfig<TDriver>
	: TDriver extends SessionDriverConfig
		? DriverConfig<TDriver>
		: TDriver extends keyof BuiltinDriverOptions
			? UnstorageConfig<TDriver>
			: CustomConfig;
