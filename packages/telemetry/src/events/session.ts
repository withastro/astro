import escalade from 'escalade/sync';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const EVENT_SESSION = 'ASTRO_CLI_SESSION_STARTED';

// :( We can't import the type because of TurboRepo circular dep limitation
type AstroUserConfig = Record<string, any>;

interface EventCliSession {
	astroVersion: string;
	cliCommand: string;
}

interface ConfigInfo {
	configKeys: string[];
	markdownPlugins: string[];
	adapter: string | null;
	integrations: string[];
	experimentalFeatures: string[];
	trailingSlash: undefined | 'always' | 'never' | 'ignore';
	build: undefined | {
		format: undefined | 'file' | 'directory'
	};
	markdown: undefined | {
		mode: undefined | 'md' | 'mdx';
		syntaxHighlight: undefined | 'shiki' | 'prism' | false;
	};
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

const multiLevelKeys = new Set([
	'build',
	'markdown',
	'markdown.shikiConfig',
	'server',
	'vite',
	'vite.resolve',
	'vite.css',
	'vite.json',
	'vite.server',
	'vite.server.fs',
	'vite.build',
	'vite.preview',
	'vite.optimizeDeps',
	'vite.ssr',
	'vite.worker',
]);
function configKeys(obj: Record<string, any> | undefined, parentKey: string): string[] {
	if (!obj) {
		return [];
	}

	return Object.entries(obj)
		.map(([key, value]) => {
			if (typeof value === 'object' && !Array.isArray(value)) {
				const localKey = parentKey ? parentKey + '.' + key : key;
				if (multiLevelKeys.has(localKey)) {
					let keys = configKeys(value, localKey).map((subkey) => key + '.' + subkey);
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
	userConfig?: AstroUserConfig
): { eventName: string; payload: EventCliSessionInternal }[] {
	const payload: EventCliSessionInternal = {
		cliCommand: event.cliCommand,
		// Versions
		astroVersion: event.astroVersion,
		viteVersion: getViteVersion(),
		nodeVersion: process.version.replace(/^v?/, ''),
		// Config Values
		config: userConfig
			? {
					markdownPlugins: [
						userConfig?.markdown?.remarkPlugins ?? [],
						userConfig?.markdown?.rehypePlugins ?? [],
					].flat(1),
					configKeys: configKeys(userConfig, ''),
					adapter: userConfig?.adapter?.name ?? null,
					integrations: userConfig?.integrations?.map((i: any) => i.name) ?? [],
					experimentalFeatures: getExperimentalFeatures(userConfig) ?? [],
					trailingSlash: userConfig?.trailingSlash,
					build: userConfig?.build ? {
						format: userConfig?.build?.format
					} : undefined,
					markdown: userConfig?.markdown ? {
						mode: userConfig?.markdown?.mode,
						syntaxHighlight: userConfig.markdown?.syntaxHighlight
					} : undefined,
			  }
			: undefined,
	};
	return [{ eventName: EVENT_SESSION, payload }];
}
