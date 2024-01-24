import type * as vite from 'vite';
import type { AstroPluginOptions } from '../@types/astro.js';
import { telemetry } from '../events/index.js';
import { eventCliSession } from '../events/session.js';

const VIRTUAL_MODULE_ID = 'astro:dev-toolbar';
const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

export default function astroDevToolbar({ settings, logger }: AstroPluginOptions): vite.Plugin {
	let telemetryTimeout: ReturnType<typeof setTimeout>;

	return {
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
			if (id === VIRTUAL_MODULE_ID) {
				return resolvedVirtualModuleId;
			}
		},
		configureServer(server) {
			server.ws.on('astro:devtoolbar:error:load', (args) => {
				logger.error(
					'toolbar',
					`Failed to load dev toolbar app from ${args.entrypoint}: ${args.error}`
				);
			});

			server.ws.on('astro:devtoolbar:error:init', (args) => {
				logger.error(
					'toolbar',
					`Failed to initialize dev toolbar app ${args.app.name} (${args.app.id}):\n${args.error}`
				);
			});

			server.ws.on('astro:devtoolbar:app:toggled', (args) => {
				// Debounce telemetry to avoid recording events when the user is rapidly toggling apps for debugging
				clearTimeout(telemetryTimeout);
				telemetryTimeout = setTimeout(() => {
					telemetry.record(
						eventCliSession('dev', settings.config, {
							app: args?.app?.id ?? 'unknown',
						})
					);
				}, 200);
			});
		},
		async load(id) {
			if (id === resolvedVirtualModuleId) {
				// TODO: In Astro 5.0, we should change the addDevToolbarApp function to separate the logic from the app's metadata.
				// That way, we can pass the app's data to the dev toolbar without having to load the app's entrypoint, which will allow
				// for a better UI in the browser where we could still show the app's name and icon even if the app's entrypoint fails to load.
				// ex: `addDevToolbarApp({ id: 'astro:dev-toolbar:app', name: 'App', icon: '🚀', entrypoint: "./src/something.ts" })`
				return `
					export const loadDevToolbarApps = async () => {
						return (await Promise.all([${settings.devToolbarApps
							.map((plugin) => `safeLoadPlugin(${JSON.stringify(plugin)})`)
							.join(',')}])).filter(app => app);
					};

					async function safeLoadPlugin(entrypoint) {
						try {
							const app = (await import(/* @vite-ignore */ entrypoint)).default;

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
	};
}
