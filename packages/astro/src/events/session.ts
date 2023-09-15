import type { AstroUserConfig } from '../@types/astro.js';

const EVENT_SESSION = 'ASTRO_CLI_SESSION_STARTED';

interface EventPayload {
	cliCommand: string;
	config?: ConfigInfo;
	configKeys?: string[];
	flags?: string[];
	optionalIntegrations?: number;
}

// Utility Types
type ConfigInfoShape<T> = Record<keyof T, string | boolean | string[] | undefined>;
type ConfigInfoNested<T> = Record<keyof T, string | boolean | string[] | undefined | object>;
type AssertKeysEqual<X extends ConfigInfoShape<Y>, Y extends Record<keyof X, any>> = never;
type AssertKeysEqualDeep<X extends ConfigInfoNested<Y>, Y extends Record<keyof X, any>> = never;

// Type Assertions!
// This will throw if createAnonymousConfigInfo() does not match the AstroUserConfig interface.
// To fix: Analyze the error and update createAnonymousConfigInfo() below.
type ConfigInfo = ReturnType<typeof createAnonymousConfigInfo>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Assertions = [
	AssertKeysEqualDeep<ConfigInfo, Required<AstroUserConfig>>,
	AssertKeysEqual<ConfigInfo['build'], Required<NonNullable<AstroUserConfig['build']>>>,
	AssertKeysEqual<ConfigInfo['image'], Required<NonNullable<AstroUserConfig['image']>>>,
	AssertKeysEqual<ConfigInfo['markdown'], Required<NonNullable<AstroUserConfig['markdown']>>>,
	AssertKeysEqual<
		ConfigInfo['experimental'],
		Required<NonNullable<AstroUserConfig['experimental']>>
	>,
	AssertKeysEqual<ConfigInfo['legacy'], Required<NonNullable<AstroUserConfig['legacy']>>>,
];

/**
 * This function creates an anonymous "config info" object from the user's config.
 * All values are sanitized to preserve anonymity.
 * Complex values should be cast to simple booleans/strings where possible.
 * `undefined` means that the value is not tracked.
 * This verbose implementation helps keep the implemetation up-to-date.
 */
function createAnonymousConfigInfo(userConfig?: AstroUserConfig) {
	return {
		adapter: userConfig?.adapter?.name ?? undefined,
		build: {
			format: userConfig?.build?.format,
			client: undefined,
			server: undefined,
			assets: undefined,
			assetsPrefix: undefined,
			serverEntry: undefined,
			redirects: undefined,
			inlineStylesheets: undefined,
			excludeMiddleware: undefined,
			split: undefined,
		},
		base: undefined,
		cacheDir: undefined,
		compressHTML: undefined,
		image: {
			endpoint: undefined,
			service: undefined,
			domains: undefined,
			remotePatterns: undefined,
		},
		integrations: userConfig?.integrations
			?.flat()
			.map((i) => i && i.name)
			.filter((i) => i && i.startsWith('@astrojs/')) as string[],
		markdown: {
			drafts: undefined,
			shikiConfig: undefined,
			syntaxHighlight: userConfig?.markdown?.syntaxHighlight,
			remarkPlugins: undefined,
			remarkRehype: undefined,
			gfm: undefined,
			smartypants: undefined,
			rehypePlugins: undefined,
		},
		outDir: undefined,
		output: userConfig?.output,
		publicDir: undefined,
		redirects: userConfig?.redirects,
		root: undefined,
		scopedStyleStrategy: userConfig?.scopedStyleStrategy,
		server: undefined,
		site: undefined,
		srcDir: undefined,
		trailingSlash: userConfig?.trailingSlash,
		vite: undefined,
		experimental: {
			optimizeHoistedScript: userConfig?.experimental?.optimizeHoistedScript,
		},
		legacy: {},
	};
}

export function eventCliSession(
	cliCommand: string,
	userConfig?: AstroUserConfig,
	flags?: Record<string, any>
): { eventName: string; payload: EventPayload }[] {
	// Filter out yargs default `_` flag which is the cli command
	const cliFlags = flags ? Object.keys(flags).filter((name) => name != '_') : undefined;

	const payload: EventPayload = {
		cliCommand,
		config: createAnonymousConfigInfo(userConfig),
		flags: cliFlags,
	};
	return [{ eventName: EVENT_SESSION, payload }];
}
