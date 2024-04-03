import type * as vite from 'vite';
import type { AstroPluginOptions } from '../@types/astro.js';
import { telemetry } from '../events/index.js';
import { eventAppToggled } from '../events/toolbar.js';
import { transformAsync } from '@babel/core';
import { extname } from 'path';
import { removeQueryString } from '../core/path.js';
import type { ParserPlugin } from '@babel/parser';

const PUBLIC_VIRTUAL_MODULE_ID_PREACT = 'astro:toolbar:preact';
const preactResolvedVirtualModuleId = '\0' + PUBLIC_VIRTUAL_MODULE_ID_PREACT;

const PRIVATE_VIRTUAL_MODULE_ID = 'astro:toolbar:internal';
const resolvedPrivateVirtualModuleId = '\0' + PRIVATE_VIRTUAL_MODULE_ID;

const PUBLIC_MODULE_ID = 'astro:toolbar';
const resolvedPublicVirtualModuleId = '\0' + PUBLIC_MODULE_ID;

export default function astroDevToolbar({ settings, logger }: AstroPluginOptions): vite.Plugin[] {
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
        if (id === PRIVATE_VIRTUAL_MODULE_ID) {
          return resolvedPrivateVirtualModuleId;
        }
        if (id === PUBLIC_MODULE_ID) {
          return resolvedPublicVirtualModuleId;
        }
			},
			configureServer(server) {
				server.hot.on('astro:devtoolbar:error:load', (args) => {
					logger.error(
						'toolbar',
						`Failed to load dev toolbar app from ${args.entrypoint}: ${args.error}`
					);
				}, 200);
			});
		},
		async load(id) {
			if (id === resolvedPublicVirtualModuleId) {
				return `
					export function defineToolbarApp(app) {
						return app;
					}
				`;
			}

			if (id === resolvedPrivateVirtualModuleId) {
				return `
					export const loadDevToolbarApps = async () => {
						return (await Promise.all([${settings.devToolbarApps
							.map(
								(plugin) =>
									`safeLoadPlugin(${JSON.stringify(plugin)}, async () => (await import(${JSON.stringify(
										(typeof plugin === 'string' ? plugin : plugin.entrypoint) + '?toolbar-app'
									)})).default, ${JSON.stringify(typeof plugin === 'string' ? plugin : plugin.entrypoint)})`
							)
							.join(',')}]));
					};

					async function safeLoadPlugin(appDefinition, importEntrypoint, entrypoint) {
						try {
							let app;
							if (typeof appDefinition === 'string') {
								app = await importEntrypoint();

								if (typeof app !== 'object' || !app.id || !app.name) {
									throw new Error("Apps must default export an object with an id, and a name.");
								}
							} else {
								app = appDefinition;

								if (typeof app !== 'object' || !app.id || !app.name || !app.entrypoint) {
									throw new Error("Apps must be an object with an id, a name and an entrypoint.");
								}

								const loadedApp = await importEntrypoint();

								if (typeof loadedApp !== 'object') {
									throw new Error("App entrypoint must default export an object.");
								}

								app = { ...app, ...loadedApp };
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
