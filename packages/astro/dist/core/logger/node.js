import { createDebug, enable as obugEnable } from 'obug';
const debuggers = {};
function debug(type, ...messages) {
	const namespace = `astro:${type}`;
	debuggers[namespace] = debuggers[namespace] || createDebug(namespace);
	return debuggers[namespace](...messages);
}
globalThis._astroGlobalDebug = debug;
function enableVerboseLogging() {
	obugEnable('astro:*,vite:*');
	debug('cli', '--verbose flag enabled! Enabling: DEBUG="astro:*,vite:*"');
	debug(
		'cli',
		'Tip: Set the DEBUG env variable directly for more control. Example: "DEBUG=astro:*,vite:* astro build".',
	);
}
export { enableVerboseLogging };
