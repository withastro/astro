import type * as vite from 'vite';
import type { AstroPluginOptions } from '../@types/astro.js';
import { telemetry } from '../events/index.js';
import { eventAppToggled } from '../events/toolbar.js';
import { transformAsync } from '@babel/core';
import { extname } from 'path';
import { removeQueryString } from '../core/path.js';
import type { ParserPlugin } from '@babel/parser';

const PUBLIC_VIRTUAL_MODULE_ID_PREACT = 'astro:toolbar:preact';
const PUBLIC_VIRTUAL_MODULE_ID = 'astro:toolbar';
const PRIVATE_VIRTUAL_MODULE_ID = 'astro:toolbar:internal';
const publicResolvedVirtualModuleId = '\0' + PUBLIC_VIRTUAL_MODULE_ID;
const privateResolvedVirtualModuleId = '\0' + PRIVATE_VIRTUAL_MODULE_ID;
const preactResolvedVirtualModuleId = '\0' + PUBLIC_VIRTUAL_MODULE_ID_PREACT;

export default function astroDevToolbarPlugins({
	settings,
	logger,
}: AstroPluginOptions): vite.Plugin[] {
	let telemetryTimeout: ReturnType<typeof setTimeout>;

	return [
		{
			name: 'astro:dev-toolbar',
			config() {
				return {
					optimizeDeps: {
						// Optimize CJS dependencies used by the dev toolbar
						include: ['astro > aria-query', 'astro > axobject-query'],
					},
				};
			},
			resolveId(id) {
				if (id === PUBLIC_VIRTUAL_MODULE_ID) {
					return publicResolvedVirtualModuleId;
				}
				if (id === PRIVATE_VIRTUAL_MODULE_ID) {
					return privateResolvedVirtualModuleId;
				}
			},
			configureServer(server) {
				server.hot.on('astro:devtoolbar:error:load', (args) => {
					logger.error(
						'toolbar',
						`Failed to load dev toolbar app from ${args.entrypoint}: ${args.error}`
					);
				});

				server.hot.on('astro:devtoolbar:error:init', (args) => {
					logger.error(
						'toolbar',
						`Failed to initialize dev toolbar app ${args.app.name} (${args.app.id}):\n${args.error}`
					);
				});

				server.hot.on('astro:devtoolbar:app:toggled', (args) => {
					// Debounce telemetry to avoid recording events when the user is rapidly toggling apps for debugging
					clearTimeout(telemetryTimeout);
					telemetryTimeout = setTimeout(() => {
						let nameToRecord = args?.app?.id;
						// Only record apps names for apps that are built-in
						if (!nameToRecord || !nameToRecord.startsWith('astro:')) {
							nameToRecord = 'other';
						}
						telemetry.record(
							eventAppToggled({
								appName: nameToRecord,
							})
						);
					}, 200);
				});
			},
			async load(id) {
				if (id === publicResolvedVirtualModuleId) {
					return `
					export function defineToolbarApp(app) {
						return app;
					}
				`;
				}

				// Internal module that the dev toolbar uses to load apps, we want for this to only
				if (id === privateResolvedVirtualModuleId) {
					// TODO: In Astro 5.0, we should change the addDevToolbarApp function to separate the logic from the app's metadata.
					// That way, we can pass the app's data to the dev toolbar without having to load the app's entrypoint, which will allow
					// for a better UI in the browser where we could still show the app's name and icon even if the app's entrypoint fails to load.
					// ex: `addDevToolbarApp({ id: 'astro:dev-toolbar:app', name: 'App', icon: '🚀', entrypoint: "./src/something.ts" })`
					return `
					export const loadDevToolbarApps = async () => {
						return (await Promise.all([${settings.devToolbarApps
							.map(
								(plugin) =>
									`safeLoadPlugin(async () => (await import(${JSON.stringify(
										plugin.entrypoint + '?toolbar-app'
									)})).default, ${JSON.stringify(plugin.entrypoint)})`
							)
							.join(',')}])).filter(app => app);
					};

					async function safeLoadPlugin(importEntrypoint, entrypoint) {
						try {
							const app = await importEntrypoint();

							if (typeof app !== 'object' || !app.id || !app.name) {
								throw new Error("Apps must default export an object with an id, and a name.");
							}

							return app;
						} catch (err) {
							console.error(\`Failed to load dev toolbar app from \${entrypoint}: \${err.message}\`);

							if (import.meta.hot) {
  							import.meta.hot.send('astro:devtoolbar:error:load', { entrypoint: entrypoint, error: err.message })
							}

							return undefined;
						}

						return undefined;
					}
				`;
				}
			},
		},
		{
			name: 'astro:dev-toolbar:preact',
			enforce: 'pre', // Need to be before Vite's plugins or they'll try to transform the JSX before us
			resolveId(id) {
				if (id === PUBLIC_VIRTUAL_MODULE_ID_PREACT) {
					return preactResolvedVirtualModuleId;
				}
			},

			async transform(code, id, options) {
				const extension = extname(removeQueryString(id));
				const shouldTryTransform = ['.jsx', '.tsx'].includes(extension) && !options?.ssr;

				if (!shouldTryTransform) {
					return;
				}

				// TODO: Seems like a fairly old school way to detect JSX, maybe there's a better way?
				const isJSXToolbarHeuristic =
					code.includes('astro:toolbar:preact') ||
					id.endsWith('?toolbar-app') ||
					code.includes('astro/toolbar-preact');

				const parserPlugins = [
					'classProperties',
					'classPrivateProperties',
					'classPrivateMethods',
					'jsx',
					extension === '.tsx' && 'typescript',
				].filter(Boolean) as ParserPlugin[];

				if (isJSXToolbarHeuristic) {
					// Inject the JSX runtime pragma if it's not already there, otherwise Vite will wrongfully error on the JSX
					// despite it already being transformed by Babel.
					let prefixedCode = code.includes('@jsxRuntime automatic')
						? code
						: `/* @jsxRuntime automatic */\n${code}`;

					const result = await transformAsync(prefixedCode, {
						ast: true,
						filename: id,
						parserOpts: {
							sourceType: 'module',
							allowAwaitOutsideFunction: true,
							plugins: parserPlugins,
						},
						plugins: [
							[
								'@babel/plugin-transform-react-jsx-development',
								{
									runtime: 'automatic',
									importSource: 'astro/toolbar-preact',
								},
							],
						],
						sourceMaps: true,
					});

					if (!result) return;

					return {
						code: result.code || code,
						map: result.map,
					};
				}

				return undefined;
			},
			load(id) {
				if (id === preactResolvedVirtualModuleId) {
					return `
					export * from "astro/toolbar-preact";
				`;
				}
			},
		},
	];
}
