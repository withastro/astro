import type { BuiltinDriverOptions, Storage } from 'unstorage';
import type { AstroCookieSetOptions } from '../cookies/cookies.js';

export interface SessionDriver {
	removeItem: (key: string) => Promise<void>;
	get: (key: string) => Promise<any>;
	setItem: (key: string, value: any) => Promise<void>;
}

export type SessionDriverFactory = (config: Record<string, any> | undefined) => SessionDriver;

// TODO: test schema matches
export interface SessionDriverConfig {
	/** TODO: */
	name: string;
	/** TODO: */
	options?: Record<string, any> | undefined;
	/** TODO: */
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
	/** TODO: */
	driver: TDriver;
	/** @deprecated TODO: */
	options?: never;
}

interface UnstorageConfig<TDriver extends keyof BuiltinDriverOptions> {
	driver: TDriver;
	options?: BuiltinDriverOptions[TDriver];
}

interface CustomConfig {
	/** Entrypoint for a custom session driver */
	driver?: string;
	/** TODO: */
	options?: Record<string, unknown>;
}

interface TestConfig {
	/** TODO: */
	driver: 'test';
	/** TODO: */
	options: {
		// TODO: use another compatible shape
		mockStorage: Storage;
	};
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
				: TDriver extends 'test'
					? TestConfig
					: CustomConfig;
