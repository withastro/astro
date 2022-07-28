import type { AstroUserConfig } from '../@types/astro';

const EVENT_SESSION = 'ASTRO_CLI_SESSION_STARTED';

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
				drafts: undefined | boolean;
				syntaxHighlight: undefined | 'shiki' | 'prism' | false;
		  };
}

interface EventPayload {
	cliCommand: string;
	config?: ConfigInfo;
	configKeys?: string[];
	flags?: string[];
	optionalIntegrations?: number;
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
	cliCommand: string,
	userConfig?: AstroUserConfig,
	flags?: Record<string, any>
): { eventName: string; payload: EventPayload }[] {
	// Filter out falsy integrations
	const configValues = userConfig
		? {
				markdownPlugins: [
					...(userConfig?.markdown?.remarkPlugins?.map((p) =>
						typeof p === 'string' ? p : typeof p
					) ?? []),
					...(userConfig?.markdown?.rehypePlugins?.map((p) =>
						typeof p === 'string' ? p : typeof p
					) ?? []),
				] as string[],
				adapter: userConfig?.adapter?.name ?? null,
				integrations: (userConfig?.integrations ?? []).filter(Boolean).map((i: any) => i?.name),
				trailingSlash: userConfig?.trailingSlash,
				build: userConfig?.build
					? {
							format: userConfig?.build?.format,
					  }
					: undefined,
				markdown: userConfig?.markdown
					? {
							drafts: userConfig.markdown?.drafts,
							syntaxHighlight: userConfig.markdown?.syntaxHighlight,
					  }
					: undefined,
		  }
		: undefined;

	// Filter out yargs default `_` flag which is the cli command
	const cliFlags = flags ? Object.keys(flags).filter((name) => name != '_') : undefined;

	const payload: EventPayload = {
		cliCommand,
		configKeys: userConfig ? configKeys(userConfig, '') : undefined,
		config: configValues,
		flags: cliFlags,
	};
	return [{ eventName: EVENT_SESSION, payload }];
}
