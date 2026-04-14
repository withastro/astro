import { createDebug, enable as obugEnable } from 'obug';

const debuggers: Record<string, ReturnType<typeof createDebug>> = {};

/**
 * Emit a message only shown in debug mode.
 * Astro (along with many of its dependencies) uses the `debug` package for debug logging.
 * You can enable these logs with the `DEBUG=astro:*` environment variable.
 * More info https://github.com/debug-js/debug#environment-variables
 */
function debug(type: string, ...messages: Array<any>) {
	const namespace = `astro:${type}`;
	debuggers[namespace] = debuggers[namespace] || createDebug(namespace);
	return debuggers[namespace](...(messages as [any, ...any[]]));
}

// This is gross, but necessary since we are depending on globals.
(globalThis as any)._astroGlobalDebug = debug;

export function enableVerboseLogging() {
	// Enable debug logging via obug's enable function
	// obug provides the same API as debug package
	obugEnable('astro:*,vite:*');
	debug('cli', '--verbose flag enabled! Enabling: DEBUG="astro:*,vite:*"');
	debug(
		'cli',
		'Tip: Set the DEBUG env variable directly for more control. Example: "DEBUG=astro:*,vite:* astro build".',
	);
}
