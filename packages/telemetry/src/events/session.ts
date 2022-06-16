import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const EVENT_SESSION = 'ASTRO_CLI_SESSION_STARTED';

// :( We can't import the type because of TurboRepo circular dep limitation
type AstroUserConfig = Record<string, any>;

interface EventCliSession {
	astroVersion: string;
	cliCommand: string;
}

interface ConfigInfo {
	markdownPlugins: string[];
	adapter: string | null;
	integrations: string[];
	trailingSlash: undefined | 'always' | 'never' | 'ignore';
	build:
		| undefined
		| {
				format: undefined | 'file' | 'directory';
		  };
	markdown:
		| undefined
		| {
				mode: undefined | 'md' | 'mdx';
				syntaxHighlight: undefined | 'shiki' | 'prism' | false;
		  };
}

interface EventCliSessionInternal extends EventCliSession {
	nodeVersion: string;
	viteVersion: string;
	config?: ConfigInfo;
	configKeys?: string[];
	flags?: string[];
	optionalIntegrations?: number;
}

function getViteVersion() {
	try {
		const { version } = require('vite/package.json');
		return version;
	} catch (e) {}
	return undefined;
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
	userConfig?: AstroUserConfig,
	flags?: Record<string, any>
): { eventName: string; payload: EventCliSessionInternal }[] {
	// Filter out falsy integrations
	const integrations = userConfig?.integrations?.filter?.(Boolean) ?? [];
	const configValues = userConfig
		? {
				markdownPlugins: [
					userConfig?.markdown?.remarkPlugins ?? [],
					userConfig?.markdown?.rehypePlugins ?? [],
				].flat(1),
				adapter: userConfig?.adapter?.name ?? null,
				integrations: integrations?.map?.((i: any) => i?.name) ?? [],
				trailingSlash: userConfig?.trailingSlash,
				build: userConfig?.build
					? {
							format: userConfig?.build?.format,
					  }
					: undefined,
				markdown: userConfig?.markdown
					? {
							mode: userConfig?.markdown?.mode,
							syntaxHighlight: userConfig.markdown?.syntaxHighlight,
					  }
					: undefined,
		  }
		: undefined;

	// Filter out yargs default `_` flag which is the cli command
	const cliFlags = flags ? Object.keys(flags).filter((name) => name != '_') : undefined;

	const payload: EventCliSessionInternal = {
		cliCommand: event.cliCommand,
		// Versions
		astroVersion: event.astroVersion,
		viteVersion: getViteVersion(),
		nodeVersion: process.version.replace(/^v?/, ''),
		configKeys: userConfig ? configKeys(userConfig, '') : undefined,
		// Config Values
		config: configValues,
		flags: cliFlags,
		// Optional integrations
		optionalIntegrations: userConfig?.integrations?.length - integrations?.length,
	};
	return [{ eventName: EVENT_SESSION, payload }];
}
