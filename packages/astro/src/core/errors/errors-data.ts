// BEFORE ADDING AN ERROR: Please look at the README.md in this folder for general guidelines on writing error messages
// Additionally, this code, much like `@types/astro.ts`, is used to generate documentation, so make sure to pass
// your changes by our wonderful docs team before merging!

interface ErrorData {
	code: number;
	message?: string | ((...params: any) => string);
	hint?: string | ((...params: any) => string);
}

// TODO: Replace with `satisfies` once TS 4.9 is out
const defineErrors = <T extends Record<string, ErrorData>>(errs: T) => errs;
export const AstroErrorData = defineErrors({
	UnknownCompilerError: {
		code: 1000,
	},
	// 1xxx and 2xxx codes are reserved for compiler errors and warnings respectively
	StaticRedirectNotAllowed: {
		code: 3001,
		message:
			"Redirects are only available when using output: 'server'. Update your Astro config if you need SSR features.",
		hint: 'See https://docs.astro.build/en/guides/server-side-rendering/#enabling-ssr-in-your-project for more information on how to enable SSR.',
	},
	SSRClientAddressNotAvailableInAdapter: {
		code: 3002,
		message: (adapterName: string) =>
			`Astro.clientAddress is not available in the ${adapterName} adapter. File an issue with the adapter to add support.`,
	},
	StaticClientAddressNotAvailable: {
		code: 3003,
		message:
			"Astro.clientAddress is only available when using output: 'server'. Update your Astro config if you need SSR features.",
		hint: 'See https://docs.astro.build/en/guides/server-side-rendering/#enabling-ssr-in-your-project for more information on how to enable SSR.',
	},
	NoMatchingStaticPathFound: {
		code: 3004,
		message: (pathName: string) =>
			`A getStaticPaths route pattern was matched, but no matching static path was found for requested path ${pathName}.`,
		hint: (possibleRoutes: string[]) =>
			`Possible dynamic routes being matched: ${possibleRoutes.join(', ')}.`,
	},
	OnlyResponseCanBeReturned: {
		code: 3005,
		message: (route: string | undefined, returnedValue: string) =>
			`Route ${
				route ? route : ''
			} returned a ${returnedValue}. Only a Response can be returned from Astro files.`,
		hint: 'See https://docs.astro.build/en/guides/server-side-rendering/#response for more information.',
	},
	MissingMediaQueryDirective: {
		code: 3006,
		message: (componentName: string) =>
			`Media query not provided for "client:media" directive. A media query similar to <${componentName} client:media="(max-width: 600px)" /> must be provided`,
	},
	NoMatchingRenderer: {
		code: 3007,
		message: (
			componentName: string,
			componentExtension: string | undefined,
			plural: boolean,
			validRenderersCount: number
		) =>
			`Unable to render ${componentName}!

${
	validRenderersCount > 0
		? `There ${plural ? 'are' : 'is'} ${validRenderersCount} renderer${
				plural ? 's' : ''
		  } configured in your \`astro.config.mjs\` file,
but ${plural ? 'none were' : 'it was not'} able to server-side render ${componentName}.`
		: `No valid renderer was found ${
				componentExtension
					? `for the .${componentExtension} file extension.`
					: `for this file extension.`
		  }`
}`,
		hint: (probableRenderers: string) =>
			`Did you mean to enable the ${probableRenderers} integration?\n\nSee https://docs.astro.build/en/core-concepts/framework-components/ for more information on how to install and configure integrations.`,
	},
	NoClientEntrypoint: {
		code: 3008,
		message: (componentName: string, clientDirective: string, rendererName: string) =>
			`${componentName} component has a \`client:${clientDirective}\` directive, but no client entrypoint was provided by ${rendererName}!`,
		hint: 'See https://docs.astro.build/en/reference/integrations-reference/#addrenderer-option for more information on how to configure your renderer.',
	},
	NoClientOnlyHint: {
		code: 3009,
		message: (componentName: string) =>
			`Unable to render ${componentName}! When using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.`,
		hint: (probableRenderers: string) =>
			`Did you mean to pass client:only="${probableRenderers}"? See https://docs.astro.build/en/reference/directives-reference/#clientonly for more information on client:only`,
	},
	InvalidStaticPathParam: {
		code: 3010,
		message: (paramType) =>
			`Invalid params given to getStaticPaths path. Expected an object, got ${paramType}`,
		hint: 'See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths.',
	},
	InvalidGetStaticPathsReturn: {
		code: 3011,
		message: (returnType) =>
			`Invalid type returned by getStaticPaths. Expected an array, got ${returnType}`,
		hint: 'See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths.',
	},
	GetStaticPathsDeprecatedRSS: {
		code: 3012,
		message:
			'The RSS helper has been removed from getStaticPaths! Try the new @astrojs/rss package instead.',
		hint: 'See https://docs.astro.build/en/guides/rss/ for more information.',
	},
	GetStaticPathsExpectedParams: {
		code: 3013,
		message: 'Missing or empty required params property on getStaticPaths route',
		hint: 'See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths.',
	},
	GetStaticPathsInvalidRouteParam: {
		code: 3014,
		message: (key: string, value: any) =>
			`Invalid getStaticPaths route parameter for \`${key}\`. Expected a string or number, received \`${typeof value}\` ("${value}")`,
		hint: 'See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths.',
	},
	GetStaticPathsRequired: {
		code: 3015,
		message:
			'getStaticPaths() function is required for dynamic routes. Make sure that you `export` a `getStaticPaths` function from your dynamic route.',
		hint: `See https://docs.astro.build/en/core-concepts/routing/#dynamic-routes for more information on dynamic routes.

Alternatively, set \`output: "server"\` in your Astro config file to switch to a non-static server build.
See https://docs.astro.build/en/guides/server-side-rendering/ for more information on non-static rendering.`,
	},
	ReservedSlotName: {
		code: 3016,
		message: (slotName: string) =>
			`Unable to create a slot named "${slotName}". ${slotName}" is a reserved slot name! Please update the name of this slot.`,
	},
	NoAdapterInstalled: {
		code: 3017,
		message: `Cannot use \`output: 'server'\` without an adapter. Please install and configure the appropriate server adapter for your final deployment.`,
		hint: 'See https://docs.astro.build/en/guides/server-side-rendering/ for more information.',
	},
	NoMatchingImport: {
		code: 3018,
		message: (componentName: string) =>
			`Could not render ${componentName}. No matching import has been found for ${componentName}.`,
		hint: 'Please make sure the component is properly imported.',
	},
	// CSS Errors - 4xxx
	UnknownCSSError: {
		code: 4000,
	},
	CSSSyntaxError: {
		code: 4001,
	},
	// Vite Errors - 5xxx
	UnknownViteError: {
		code: 5000,
	},
	FailedToLoadModuleSSR: {
		code: 5001,
		message: (importName: string) => `Could not import "${importName}".`,
		hint: 'This is often caused by a typo in the import path. Please make sure the file exists.',
	},
	InvalidGlob: {
		code: 5002,
		message: (globPattern: string) =>
			`Invalid glob pattern: "${globPattern}". Glob patterns must start with './', '../' or '/'.`,
		hint: 'See https://docs.astro.build/en/guides/imports/#glob-patterns for more information on supported glob patterns.',
	},
	// Markdown Errors - 6xxx
	UnknownMarkdownError: {
		code: 6000,
	},
	MarkdownFrontmatterParseError: {
		code: 6001,
	},
	// Config Errors - 7xxx
	UnknownConfigError: {
		code: 7000,
	},
	ConfigNotFound: {
		code: 7001,
		message: (configFile: string) =>
			`Unable to resolve --config "${configFile}"! Does the file exist?`,
	},
	ConfigLegacyKey: {
		code: 7002,
		message: (legacyConfigKey: string) => `Legacy configuration detected: "${legacyConfigKey}".`,
		hint: 'Please update your configuration to the new format!\nSee https://astro.build/config for more information.',
	},
	// Generic catch-all
	UnknownError: {
		code: 99999,
	},
} as const);

type ValueOf<T> = T[keyof T];
export type AstroErrorCodes = ValueOf<{
	[T in keyof typeof AstroErrorData]: typeof AstroErrorData[T]['code'];
}>;
