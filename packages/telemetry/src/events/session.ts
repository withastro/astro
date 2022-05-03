import escalade from 'escalade/sync';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const EVENT_SESSION = 'ASTRO_CLI_SESSION_STARTED';

interface EventCliSession {
	astroVersion: string;
	cliCommand: string;
}

interface ConfigInfo {
	hasViteConfig: boolean;
	hasBase: boolean;
	viteKeys: string[];
	markdownPlugins: string[];
	adapter: string | null;
	integrations: string[];
	experimentalFeatures: string[];
}

interface EventCliSessionInternal extends EventCliSession {
	nodeVersion: string;
	viteVersion: string;
	config?: ConfigInfo;
}

function getViteVersion() {
	try {
		const { version } = require('vite/package.json');
		return version;
	} catch (e) {}
	return undefined;
}

function getExperimentalFeatures(astroConfig?: Record<string, any>): string[] | undefined {
	if (!astroConfig) return undefined;
	return Object.entries(astroConfig.experimental || []).reduce((acc, [key, value]) => {
		if (value) {
			acc.push(key);
		}
		return acc;
	}, [] as string[]);
}

const secondLevelViteKeys = new Set([
	'resolve',
	'css',
	'json',
	'server',
	'server.fs',
	'build',
	'preview',
	'optimizeDeps',
	'ssr',
	'worker',
]);
function viteConfigKeys(obj: Record<string, any> | undefined, parentKey: string): string[] {
	if (!obj) {
		return [];
	}

	return Object.entries(obj)
		.map(([key, value]) => {
			if (typeof value === 'object' && !Array.isArray(value)) {
				const localKey = parentKey ? parentKey + '.' + key : key;
				if (secondLevelViteKeys.has(localKey)) {
					let keys = viteConfigKeys(value, localKey).map((subkey) => key + '.' + subkey);
					keys.unshift(key);
					return keys;
				}
			}

			return key;
		})
		.flat(1);
}

export function eventCliSession(
	event: EventCliSession,
	astroConfig?: Record<string, any>
): { eventName: string; payload: EventCliSessionInternal }[] {
	const payload: EventCliSessionInternal = {
		cliCommand: event.cliCommand,
		// Versions
		astroVersion: event.astroVersion,
		viteVersion: getViteVersion(),
		nodeVersion: process.version.replace(/^v?/, ''),
		// Config Values
		config: astroConfig
			? {
					hasViteConfig: Object.keys(astroConfig?.vite).length > 0,
					markdownPlugins: [
						astroConfig?.markdown?.remarkPlugins ?? [],
						astroConfig?.markdown?.rehypePlugins ?? [],
					].flat(1),
					hasBase: astroConfig?.base !== '/',
					viteKeys: viteConfigKeys(astroConfig?.vite, ''),
					adapter: astroConfig?.adapter?.name ?? null,
					integrations: astroConfig?.integrations?.map((i: any) => i.name) ?? [],
					experimentalFeatures: getExperimentalFeatures(astroConfig) ?? [],
			  }
			: undefined,
	};
	return [{ eventName: EVENT_SESSION, payload }];
}
