export interface AstroLoggerDestination<T = unknown> {
	/**
	 * It receives a message and writes it into a destination
	 */
	write: (chunk: T) => void;
	/**
	 * It dumps logs without closing the connection to the destination.
	 * Method that can be used by specialized loggers.
	 */
	flush?: () => Promise<void> | void;
	/**
	 * It dumps logs and closes the connection to the destination.
	 * Method that can be used by specialized loggers.
	 */
	close?: () => Promise<void> | void;
}
/**
 * The level of logging. Priority is the following:
 * 1. debug
 * 2. error
 * 3. warn
 * 4. info
 * 5. silent
 */
export type AstroLoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
/**
 * Defined logger labels. Add more as needed, but keep them high-level & reusable,
 * rather than specific to a single command, function, use, etc. The label will be
 * shown in the log message to the user, so it should be relevant.
 */
declare const AstroLoggerLabels: readonly [
	'add',
	'build',
	'check',
	'config',
	'content',
	'crypto',
	'deprecated',
	'markdown',
	'router',
	'types',
	'vite',
	'watch',
	'middleware',
	'preferences',
	'redirects',
	'sync',
	'session',
	'toolbar',
	'assets',
	'env',
	'update',
	'adapter',
	'islands',
	'cache',
	'csp',
	'SKIP_FORMAT',
];
type AstroLoggerLabel = (typeof AstroLoggerLabels)[number];
export interface AstroLogOptions {
	destination: AstroLoggerDestination<AstroLoggerMessage>;
	level: AstroLoggerLevel;
	/**
	 * Optional configuration for the logger destination
	 */
	config?: Record<string, any> | undefined;
}
/** @lintignore */
export declare const dateTimeFormat: Intl.DateTimeFormat;
export interface AstroLoggerMessage {
	/**
	 * Label associated to the message. Used by Astro for pretty logging
	 */
	label: string | null;
	/**
	 * The level of the log
	 */
	level: AstroLoggerLevel;
	/**
	 * The message of the log
	 */
	message: string;
	/**
	 * Whether a newline should be appended to the end of the message i.e. message + '\n'
	 */
	newLine: boolean;
}
export declare const levels: Record<AstroLoggerLevel, number>;
export declare function isLogLevelEnabled(
	configuredLogLevel: AstroLoggerLevel,
	level: AstroLoggerLevel,
): boolean;
export declare function debug(...args: any[]): void;
/**
 * Get the prefix for a log message.
 * This includes the timestamp, log level, and label all properly formatted
 * with colors. This is shared across different loggers, so it's defined here.
 */
export declare function getEventPrefix({ level, label }: AstroLoggerMessage): string;
/** Print out a timer message for debug() */
export declare function timerMessage(message: string, startTime?: number): string;
export declare class AstroLogger {
	options: AstroLogOptions;
	constructor(options: AstroLogOptions);
	info(label: AstroLoggerLabel | null, message: string, newLine?: boolean): void;
	warn(label: AstroLoggerLabel | null, message: string, newLine?: boolean): void;
	error(label: AstroLoggerLabel | null, message: string, newLine?: boolean): void;
	debug(label: AstroLoggerLabel, ...messages: any[]): void;
	level(): AstroLoggerLevel;
	forkIntegrationLogger(label: string): AstroIntegrationLogger;
	setDestination(destination: AstroLoggerDestination<AstroLoggerMessage>): void;
	/**
	 * It calls the `close` function of the provided destination, if it exists.
	 */
	close(): void;
	/**
	 * It calls the `flush` function of the provided destinatin, if it exists.
	 */
	flush(): void;
}
export declare class AstroIntegrationLogger {
	options: AstroLogOptions;
	label: string;
	constructor(logging: AstroLogOptions, label: string);
	/**
	 * Creates a new logger instance with a new label, but the same log options.
	 */
	fork(label: string): AstroIntegrationLogger;
	info(message: string): void;
	warn(message: string): void;
	error(message: string): void;
	debug(message: string): void;
	/**
	 * It calls the `flush` function of the provided destination, if it exists.
	 */
	flush(): void;
	/**
	 * It calls the `close` function of the provided destination, if it exists.
	 */
	close(): void;
}
export {};
