import fsMod from 'node:fs';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import colors from 'picocolors';
import type { InlineConfig, ViteDevServer } from 'vite';
import { mergeConfig as mergeViteConfig } from 'vite';
import astroIntegrationActionsRouteHandler from '../actions/integration.js';
import { isActionsFilePresent } from '../actions/utils.js';
import { CONTENT_LAYER_TYPE } from '../content/consts.js';
import { globalContentLayer } from '../content/content-layer.js';
import { globalContentConfigObserver } from '../content/utils.js';
import type { SerializedSSRManifest } from '../core/app/types.js';
import type { PageBuildData } from '../core/build/types.js';
import { buildClientDirectiveEntrypoint } from '../core/client-directive/index.js';
import { mergeConfig } from '../core/config/index.js';
import { validateConfigRefined } from '../core/config/validate.js';
import { validateSetAdapter } from '../core/dev/adapter-validation.js';
import type { AstroIntegrationLogger, Logger } from '../core/logger/core.js';
import { getClientOutputDirectory } from '../prerender/utils.js';
import type { AstroSettings } from '../types/astro.js';
import type { AstroConfig } from '../types/public/config.js';
import type {
	ContentEntryType,
	DataEntryType,
	RefreshContentOptions,
} from '../types/public/content.js';
import type {
	AstroIntegration,
	AstroRenderer,
	BaseIntegrationHooks,
	HookParameters,
	IntegrationResolvedRoute,
	IntegrationRouteData,
	RouteOptions,
	RouteToHeaders,
} from '../types/public/integrations.js';
import type { RouteData } from '../types/public/internal.js';
import { validateSupportedFeatures } from './features-validation.js';

async function withTakingALongTimeMsg<T>({
	name,
	hookName,
	hookFn,
	logger,
	integrationLogger,
}: {
	name: string;
	hookName: keyof BaseIntegrationHooks;
	hookFn: () => T | Promise<T>;
	logger: Logger;
	integrationLogger: AstroIntegrationLogger;
}): Promise<T> {
	const timeout = setTimeout(() => {
		logger.info(
			'build',
			`Waiting for integration ${colors.bold(JSON.stringify(name))}, hook ${colors.bold(
				JSON.stringify(hookName),
			)}...`,
		);
	}, 3000);
	try {
		return await hookFn();
	} catch (err) {
		integrationLogger.error(
			`An unhandled error occurred while running the ${colors.bold(JSON.stringify(hookName))} hook`,
		);
		throw err;
	} finally {
		clearTimeout(timeout);
	}
}

/** Executes the specified hook of the integration if present, and handles loggers */
async function runHookInternal<THook extends keyof BaseIntegrationHooks>({
	integration,
	hookName,
	logger,
	params,
}: {
	integration: AstroIntegration;
	hookName: THook;
	logger: Logger;
	params: () => Omit<HookParameters<NoInfer<THook>>, 'logger'>;
}) {
	const hook = integration?.hooks?.[hookName];
	const integrationLogger = getLogger(integration, logger);
	if (hook) {
		await withTakingALongTimeMsg({
			name: integration.name,
			hookName,
			hookFn: () => hook(Object.assign(params(), { logger: integrationLogger }) as any),
			logger,
			integrationLogger,
		});
	}
	return { integrationLogger };
}

// Used internally to store instances of loggers.
const Loggers = new WeakMap<AstroIntegration, AstroIntegrationLogger>();

function getLogger(integration: AstroIntegration, logger: Logger) {
	if (Loggers.has(integration)) {
		// SAFETY: we check the existence in the if block
		return Loggers.get(integration)!;
	}
	const integrationLogger = logger.forkIntegrationLogger(integration.name);
	Loggers.set(integration, integrationLogger);
	return integrationLogger;
}

const serverEventPrefix = 'astro-dev-toolbar';

export function getToolbarServerCommunicationHelpers(server: ViteDevServer) {
	return {
		/**
		 * Send a message to the dev toolbar that an app can listen for. The payload can be any serializable data.
		 * @param event - The event name
		 * @param payload - The payload to send
		 */
		send: <T>(event: string, payload: T) => {
			server.hot.send(event, payload);
		},
		/**
		 * Receive a message from a dev toolbar app.
		 * @param event
		 * @param callback
		 */
		on: <T>(event: string, callback: (data: T) => void) => {
			server.hot.on(event, callback);
		},
		/**
		 * Fired when an app is initialized.
		 * @param appId - The id of the app that was initialized
		 * @param callback - The callback to run when the app is initialized
		 */
		onAppInitialized: (appId: string, callback: (data: Record<string, never>) => void) => {
			server.hot.on(`${serverEventPrefix}:${appId}:initialized`, callback);
		},
		/**
		 * Fired when an app is toggled on or off.
		 * @param appId - The id of the app that was toggled
		 * @param callback - The callback to run when the app is toggled
		 */
		onAppToggled: (appId: string, callback: (data: { state: boolean }) => void) => {
			server.hot.on(`${serverEventPrefix}:${appId}:toggled`, callback);
		},
	};
}

// Will match any invalid characters (will be converted to _). We only allow a-zA-Z0-9.-_
const SAFE_CHARS_RE = /[^\w.-]/g;

export function normalizeCodegenDir(integrationName: string): string {
	return `./integrations/${integrationName.replace(SAFE_CHARS_RE, '_')}/`;
}

export function normalizeInjectedTypeFilename(filename: string, integrationName: string): string {
	if (!filename.endsWith('.d.ts')) {
		throw new Error(
			`Integration ${colors.bold(integrationName)} is injecting a type that does not end with "${colors.bold('.d.ts')}"`,
		);
	}
	return `${normalizeCodegenDir(integrationName)}${filename.replace(SAFE_CHARS_RE, '_')}`;
}

interface RunHookConfigSetup {
	settings: AstroSettings;
	command: 'dev' | 'build' | 'preview' | 'sync';
	logger: Logger;
	isRestart?: boolean;
	fs?: typeof fsMod;
}

export async function runHookConfigSetup({
	settings,
	command,
	logger,
	isRestart = false,
	fs = fsMod,
}: RunHookConfigSetup): Promise<AstroSettings> {
	// An adapter is an integration, so if one is provided add it to the list of integrations.
	if (settings.config.adapter) {
		settings.config.integrations.unshift(settings.config.adapter);
	}
	const actionsFilename = await isActionsFilePresent(fs, settings.config.srcDir);
	if (actionsFilename) {
		settings.config.integrations.push(
			astroIntegrationActionsRouteHandler({ settings, filename: actionsFilename }),
		);
	}

	let updatedConfig: AstroConfig = { ...settings.config };
	let updatedSettings: AstroSettings = { ...settings, config: updatedConfig };
	let addedClientDirectives = new Map<string, Promise<string>>();
	let astroJSXRenderer: AstroRenderer | null = null;

	// eslint-disable-next-line @typescript-eslint/prefer-for-of -- We need a for loop to be able to read integrations pushed while the loop is running.
	for (let i = 0; i < updatedConfig.integrations.length; i++) {
		const integration = updatedConfig.integrations[i];

		/**
		 * By making integration hooks optional, Astro can now ignore null or undefined Integrations
		 * instead of giving an internal error most people can't read
		 *
		 * This also enables optional integrations, e.g.
		 * ```ts
		 * integration: [
		 *   // Only run `compress` integration in production environments, etc...
		 *   import.meta.env.production ? compress() : null
		 * ]
		 * ```
		 */

		const { integrationLogger } = await runHookInternal({
			integration,
			hookName: 'astro:config:setup',
			logger,
			params: () => {
				const hooks: Omit<HookParameters<'astro:config:setup'>, 'logger'> = {
					config: updatedConfig,
					command,
					isRestart,
					addRenderer(renderer: AstroRenderer) {
						if (!renderer.name) {
							throw new Error(
								`Integration ${colors.bold(integration.name)} has an unnamed renderer.`,
							);
						}

						if (!renderer.serverEntrypoint) {
							throw new Error(
								`Renderer ${colors.bold(renderer.name)} does not provide a serverEntrypoint.`,
							);
						}

						if (renderer.name === 'astro:jsx') {
							astroJSXRenderer = renderer;
						} else {
							updatedSettings.renderers.push(renderer);
						}
					},
					injectScript: (stage, content) => {
						updatedSettings.scripts.push({ stage, content });
					},
					updateConfig: (newConfig) => {
						updatedConfig = mergeConfig(updatedConfig, newConfig);
						return { ...updatedConfig };
					},
					injectRoute: (injectRoute) => {
						if (injectRoute.entrypoint == null && 'entryPoint' in injectRoute) {
							logger.warn(
								null,
								`The injected route "${injectRoute.pattern}" by ${integration.name} specifies the entry point with the "entryPoint" property. This property is deprecated, please use "entrypoint" instead.`,
							);
							injectRoute.entrypoint = injectRoute.entryPoint as string;
						}
						updatedSettings.injectedRoutes.push({ ...injectRoute, origin: 'external' });
					},
					addWatchFile: (path) => {
						updatedSettings.watchFiles.push(path instanceof URL ? fileURLToPath(path) : path);
					},
					addDevToolbarApp: (entrypoint) => {
						updatedSettings.devToolbarApps.push(entrypoint);
					},
					addClientDirective: ({ name, entrypoint }) => {
						if (updatedSettings.clientDirectives.has(name) || addedClientDirectives.has(name)) {
							throw new Error(
								`The "${integration.name}" integration is trying to add the "${name}" client directive, but it already exists.`,
							);
						}
						// TODO: this should be performed after astro:config:done
						addedClientDirectives.set(
							name,
							buildClientDirectiveEntrypoint(name, entrypoint, settings.config.root),
						);
					},
					addMiddleware: ({ order, entrypoint }) => {
						if (typeof updatedSettings.middlewares[order] === 'undefined') {
							throw new Error(
								`The "${integration.name}" integration is trying to add middleware but did not specify an order.`,
							);
						}
						logger.debug(
							'middleware',
							`The integration ${integration.name} has added middleware that runs ${
								order === 'pre' ? 'before' : 'after'
							} any application middleware you define.`,
						);
						updatedSettings.middlewares[order].push(
							typeof entrypoint === 'string' ? entrypoint : fileURLToPath(entrypoint),
						);
					},
					createCodegenDir: () => {
						const codegenDir = new URL(normalizeCodegenDir(integration.name), settings.dotAstroDir);
						fs.mkdirSync(codegenDir, { recursive: true });
						return codegenDir;
					},
				};

				// Public, intentionally undocumented hooks - not subject to semver.
				// Intended for internal integrations (ex. `@astrojs/mdx`),
				// though accessible to integration authors if discovered.

				function addPageExtension(...input: (string | string[])[]) {
					const exts = (input.flat(Infinity) as string[]).map(
						(ext) => `.${ext.replace(/^\./, '')}`,
					);
					updatedSettings.pageExtensions.push(...exts);
				}

				function addContentEntryType(contentEntryType: ContentEntryType) {
					updatedSettings.contentEntryTypes.push(contentEntryType);
				}

				function addDataEntryType(dataEntryType: DataEntryType) {
					updatedSettings.dataEntryTypes.push(dataEntryType);
				}

				Object.defineProperty(hooks, 'addPageExtension', {
					value: addPageExtension,
					writable: false,
					enumerable: false,
				});
				Object.defineProperty(hooks, 'addContentEntryType', {
					value: addContentEntryType,
					writable: false,
					enumerable: false,
				});
				Object.defineProperty(hooks, 'addDataEntryType', {
					value: addDataEntryType,
					writable: false,
					enumerable: false,
				});

				return hooks;
			},
		});

		// Add custom client directives to settings, waiting for compiled code by esbuild
		for (const [name, compiled] of addedClientDirectives) {
			updatedSettings.clientDirectives.set(name, await compiled);
		}

		try {
			updatedConfig = await validateConfigRefined(updatedConfig);
		} catch (error) {
			integrationLogger.error('An error occurred while updating the config');
			throw error;
		}
	}

	// The astro:jsx renderer should come last, to not interfere with others.
	if (astroJSXRenderer) {
		updatedSettings.renderers.push(astroJSXRenderer);
	}

	// TODO: Astro 6.0
	// Remove this hack to avoid breaking changes, and change the default value of redirectToDefaultLocale
	if (updatedConfig.i18n && typeof updatedConfig.i18n.routing !== 'string') {
		updatedConfig.i18n.routing.redirectToDefaultLocale ??=
			updatedConfig.i18n.routing.prefixDefaultLocale || false;
	}

	updatedSettings.config = updatedConfig;
	return updatedSettings;
}

export async function runHookConfigDone({
	settings,
	logger,
	command,
}: {
	settings: AstroSettings;
	logger: Logger;
	command?: 'dev' | 'build' | 'preview' | 'sync';
}) {
	for (const integration of settings.config.integrations) {
		await runHookInternal({
			integration,
			hookName: 'astro:config:done',
			logger,
			params: () => ({
				config: settings.config,
				setAdapter(adapter) {
					validateSetAdapter(logger, settings, adapter, integration.name, command);

					if (adapter.adapterFeatures?.buildOutput !== 'static') {
						settings.buildOutput = 'server';
					}

					if (!adapter.supportedAstroFeatures) {
						throw new Error(
							`The adapter ${adapter.name} doesn't provide a feature map. It is required in Astro 4.0.`,
						);
					} else {
						validateSupportedFeatures(
							adapter.name,
							adapter.supportedAstroFeatures,
							settings,
							logger,
						);
					}
					settings.adapter = adapter;
				},
				injectTypes(injectedType) {
					const normalizedFilename = normalizeInjectedTypeFilename(
						injectedType.filename,
						integration.name,
					);

					settings.injectedTypes.push({
						filename: normalizedFilename,
						content: injectedType.content,
					});

					// It must be relative to dotAstroDir here and not inside normalizeInjectedTypeFilename
					// because injectedTypes are handled relatively to the dotAstroDir already
					return new URL(normalizedFilename, settings.dotAstroDir);
				},
				get buildOutput() {
					return settings.buildOutput!; // settings.buildOutput is always set at this point
				},
			}),
		});
	}
}

export async function runHookServerSetup({
	config,
	server,
	logger,
}: {
	config: AstroConfig;
	server: ViteDevServer;
	logger: Logger;
}) {
	let refreshContent: undefined | ((options: RefreshContentOptions) => Promise<void>);
	refreshContent = async (options: RefreshContentOptions) => {
		const contentConfig = globalContentConfigObserver.get();
		if (
			contentConfig.status !== 'loaded' ||
			!Object.values(contentConfig.config.collections).some(
				(collection) => collection.type === CONTENT_LAYER_TYPE,
			)
		) {
			return;
		}

		const contentLayer = await globalContentLayer.get();
		await contentLayer?.sync(options);
	};

	for (const integration of config.integrations) {
		await runHookInternal({
			integration,
			hookName: 'astro:server:setup',
			logger,
			params: () => ({
				server,
				toolbar: getToolbarServerCommunicationHelpers(server),
				refreshContent,
			}),
		});
	}
}

export async function runHookServerStart({
	config,
	address,
	logger,
}: {
	config: AstroConfig;
	address: AddressInfo;
	logger: Logger;
}) {
	for (const integration of config.integrations) {
		await runHookInternal({
			integration,
			hookName: 'astro:server:start',
			logger,
			params: () => ({ address }),
		});
	}
}

export async function runHookServerDone({
	config,
	logger,
}: {
	config: AstroConfig;
	logger: Logger;
}) {
	for (const integration of config.integrations) {
		await runHookInternal({
			integration,
			hookName: 'astro:server:done',
			logger,
			params: () => ({}),
		});
	}
}

export async function runHookBuildStart({
	config,
	logger,
}: {
	config: AstroConfig;
	logger: Logger;
}) {
	for (const integration of config.integrations) {
		await runHookInternal({
			integration,
			hookName: 'astro:build:start',
			logger,
			params: () => ({}),
		});
	}
}

export async function runHookBuildSetup({
	config,
	vite,
	pages,
	target,
	logger,
}: {
	config: AstroConfig;
	vite: InlineConfig;
	pages: Map<string, PageBuildData>;
	target: 'server' | 'client';
	logger: Logger;
}): Promise<InlineConfig> {
	let updatedConfig = vite;

	for (const integration of config.integrations) {
		await runHookInternal({
			integration,
			hookName: 'astro:build:setup',
			logger,
			params: () => ({
				vite,
				pages,
				target,
				updateConfig: (newConfig) => {
					updatedConfig = mergeViteConfig(updatedConfig, newConfig);
					return { ...updatedConfig };
				},
			}),
		});
	}

	return updatedConfig;
}

type RunHookBuildSsr = {
	config: AstroConfig;
	manifest: SerializedSSRManifest;
	logger: Logger;
	entryPoints: Map<RouteData, URL>;
	middlewareEntryPoint: URL | undefined;
};

export async function runHookBuildSsr({
	config,
	manifest,
	logger,
	entryPoints,
	middlewareEntryPoint,
}: RunHookBuildSsr) {
	const entryPointsMap = new Map();
	for (const [key, value] of entryPoints) {
		entryPointsMap.set(toIntegrationRouteData(key), value);
	}
	for (const integration of config.integrations) {
		await runHookInternal({
			integration,
			hookName: 'astro:build:ssr',
			logger,
			params: () => ({
				manifest,
				entryPoints: entryPointsMap,
				middlewareEntryPoint,
			}),
		});
	}
}

export async function runHookBuildGenerated({
	settings,
	logger,
	experimentalRouteToHeaders,
}: {
	settings: AstroSettings;
	logger: Logger;
	experimentalRouteToHeaders: RouteToHeaders;
}) {
	const dir =
		settings.buildOutput === 'server' ? settings.config.build.client : settings.config.outDir;

	for (const integration of settings.config.integrations) {
		await runHookInternal({
			integration,
			hookName: 'astro:build:generated',
			logger,
			params: () => ({ dir, experimentalRouteToHeaders }),
		});
	}
}

type RunHookBuildDone = {
	settings: AstroSettings;
	pages: string[];
	routes: RouteData[];
	logger: Logger;
};

export async function runHookBuildDone({ settings, pages, routes, logger }: RunHookBuildDone) {
	const dir = getClientOutputDirectory(settings);
	await fsMod.promises.mkdir(dir, { recursive: true });
	const integrationRoutes = routes.map(toIntegrationRouteData);

	for (const integration of settings.config.integrations) {
		await runHookInternal({
			integration,
			hookName: 'astro:build:done',
			logger,
			params: () => ({
				pages: pages.map((p) => ({ pathname: p })),
				dir,
				routes: integrationRoutes,
				assets: new Map(
					routes.filter((r) => r.distURL !== undefined).map((r) => [r.route, r.distURL!]),
				),
			}),
		});
	}
}

export async function runHookRouteSetup({
	route,
	settings,
	logger,
}: {
	route: RouteOptions;
	settings: AstroSettings;
	logger: Logger;
}) {
	const prerenderChangeLogs: { integrationName: string; value: boolean | undefined }[] = [];

	for (const integration of settings.config.integrations) {
		const originalRoute = { ...route };
		await runHookInternal({
			integration,
			hookName: 'astro:route:setup',
			logger,
			params: () => ({ route }),
		});
		if (route.prerender !== originalRoute.prerender) {
			prerenderChangeLogs.push({ integrationName: integration.name, value: route.prerender });
		}
	}

	if (prerenderChangeLogs.length > 1) {
		logger.debug(
			'router',
			`The ${route.component} route's prerender option has been changed multiple times by integrations:\n` +
				prerenderChangeLogs.map((log) => `- ${log.integrationName}: ${log.value}`).join('\n'),
		);
	}
}

export async function runHookRoutesResolved({
	routes,
	settings,
	logger,
}: {
	routes: Array<RouteData>;
	settings: AstroSettings;
	logger: Logger;
}) {
	for (const integration of settings.config.integrations) {
		await runHookInternal({
			integration,
			hookName: 'astro:routes:resolved',
			logger,
			params: () => ({
				routes: routes.map((route) => toIntegrationResolvedRoute(route)),
			}),
		});
	}
}

export function toIntegrationResolvedRoute(route: RouteData): IntegrationResolvedRoute {
	return {
		isPrerendered: route.prerender,
		entrypoint: route.component,
		pattern: route.route,
		params: route.params,
		origin: route.origin,
		generate: route.generate,
		patternRegex: route.pattern,
		segments: route.segments,
		type: route.type,
		pathname: route.pathname,
		redirect: route.redirect,
		redirectRoute: route.redirectRoute
			? toIntegrationResolvedRoute(route.redirectRoute)
			: undefined,
	};
}

function toIntegrationRouteData(route: RouteData): IntegrationRouteData {
	return {
		route: route.route,
		component: route.component,
		generate: route.generate,
		params: route.params,
		pathname: route.pathname,
		segments: route.segments,
		prerender: route.prerender,
		redirect: route.redirect,
		redirectRoute: route.redirectRoute ? toIntegrationRouteData(route.redirectRoute) : undefined,
		type: route.type,
		pattern: route.pattern,
		distURL: route.distURL,
	};
}
