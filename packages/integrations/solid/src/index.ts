import { fileURLToPath } from 'node:url';
import type { Options as ViteSolidPluginOptions } from '@solidjs/vite-plugin';
import solid from '@solidjs/vite-plugin';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type { Plugin, PluginOption } from 'vite';
import { crawlFrameworkPkgs } from 'vitefu';
import { getContainerRenderer as getContainerRendererImpl } from './container-renderer.js';

function getViteConfiguration(
	{ include, exclude, compiler, serverFunctions }: Options,
	solidNoExternal: string[],
	manifestSource: ManifestSource,
) {
	const plugins: PluginOption[] = [
		solid({
			include,
			exclude,
			compiler,
			ssr: true,
			// The integration owns endpoint dispatch through an injected Astro
			// route (see server-function-endpoint.ts), so server-function
			// requests flow through Astro's middleware pipeline in dev too —
			// stand the plugin's own dev middleware down.
			serverFunctions: serverFunctions
				? { ...(serverFunctions === true ? {} : serverFunctions), devMiddleware: false }
				: undefined,
		}),
		configEnvironmentPlugin(solidNoExternal, manifestSource),
	];

	return { plugins };
}

function serverFunctionsEndpoint(serverFunctions: Options['serverFunctions']): string {
	const endpoint =
		(typeof serverFunctions === 'object' && serverFunctions.endpoint) || '/_server';
	return endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
}

/**
 * @deprecated Import `getContainerRenderer` from `@astrojs/solid-js/container-renderer` instead.
 */
export function getContainerRenderer(): AstroRenderer {
	console.warn(
		'[@astrojs/solid-js] Importing `getContainerRenderer` from `@astrojs/solid-js` is deprecated. Import it from `@astrojs/solid-js/container-renderer` instead.',
	);
	return getContainerRendererImpl();
}

export interface Options
	extends Pick<ViteSolidPluginOptions, 'include' | 'exclude' | 'compiler' | 'serverFunctions'> {}

export default function (options: Options = {}): AstroIntegration {
	const serverComponents =
		typeof options.serverFunctions === 'object' && !!options.serverFunctions.components;
	// Filled in during `astro:config:done` (before dev/build starts) and read
	// by the manifest virtual module's load hook.
	const manifestSource: ManifestSource = {
		command: 'dev',
		clientDirs: [],
		serverDir: null,
		base: '/',
		serverComponents,
	};

	return {
		name: '@astrojs/solid-js',
		hooks: {
			'astro:config:setup': async ({
				command,
				config,
				addRenderer,
				updateConfig,
				injectRoute,
				injectScript,
			}) => {
				manifestSource.command = command;
				if (options.serverFunctions) {
					// The transport posts to `<endpoint>/<id>` and
					// `<endpoint>/data/<id>` — a rest route covers both (and the
					// bare mount, which the runtime handler answers with a 404).
					injectRoute({
						pattern: `${serverFunctionsEndpoint(options.serverFunctions)}/[...solidServerFunction]`,
						entrypoint: '@astrojs/solid-js/server-function-endpoint.js',
						prerender: false,
					});
				}
				if (serverComponents) {
					// Installs the t=0 document-adoption registry and the transport
					// policy (component responses morph their boundary instead of
					// decoding as data). Astro's before-hydration stage runs it
					// ahead of every island hydration. The server-side halves live
					// in server.ts (render plugin, direct-call transform) and the
					// endpoint handler virtual (response transform).
					injectScript(
						'before-hydration',
						`import { installServerComponents } from '@solidjs/web/frames';\ninstallServerComponents();`,
					);
				}
				// Solid component libraries that ship pre-compiled browser
				// artifacts via the `exports.solid` condition must go through
				// Vite's transform pipeline in non-client environments.
				// Without this, Node resolves those packages via the `default`
				// condition, which picks up browser-only code that crashes
				// during prerendering.
				const solidPackages = await crawlFrameworkPkgs({
					root: fileURLToPath(config.root),
					isBuild: false,
					isFrameworkPkgByJson(pkgJson) {
						return !!(
							pkgJson.peerDependencies?.['solid-js'] ||
							pkgJson.peerDependencies?.['@solidjs/web']
						);
					},
				});

				addRenderer(getContainerRendererImpl());
				updateConfig({
					vite: getViteConfiguration(options, solidPackages.ssr.noExternal, manifestSource),
				});
			},
			'astro:config:done': ({ logger, config }) => {
				// Where the client build's `.vite/manifest.json` will land. For
				// `output: 'server'` client assets go to `build.client`; for static
				// output they go to `outDir` directly. Record both candidates and
				// probe at runtime, mirroring @solidjs/vite-plugin's own fallback.
				manifestSource.clientDirs = [
					...new Set([fileURLToPath(config.build.client), fileURLToPath(config.outDir)]),
				];
				manifestSource.serverDir =
					config.output === 'server' ? fileURLToPath(config.build.server) : null;
				manifestSource.base = config.base;

				if (options.serverFunctions && manifestSource.command === 'build' && !config.adapter) {
					throw new Error(
						'[@astrojs/solid-js] `serverFunctions` needs a server to answer function calls at runtime. ' +
							'Install an adapter (e.g. @astrojs/node) to build with server functions enabled.',
					);
				}

				const knownJsxRenderers = ['@astrojs/react', '@astrojs/preact', '@astrojs/solid-js'];
				const enabledKnownJsxRenderers = config.integrations.filter((renderer) =>
					knownJsxRenderers.includes(renderer.name),
				);

				if (enabledKnownJsxRenderers.length > 1 && !options.include && !options.exclude) {
					logger.warn(
						'More than one JSX renderer is enabled. This will lead to unexpected behavior unless you set the `include` or `exclude` option. See https://docs.astro.build/en/guides/integrations-guide/solid-js/#combining-multiple-jsx-frameworks for more information.',
					);
				}
			},
		},
	};
}

export type ManifestSource = {
	command: string;
	clientDirs: string[];
	serverDir: string | null;
	base: string;
	serverComponents: boolean;
};

const VIRTUAL_MANIFEST_ID = 'virtual:astro-solid-manifest';
const RESOLVED_VIRTUAL_MANIFEST_ID = '\0' + VIRTUAL_MANIFEST_ID;

// Handoff channel between the client build (which produces the manifest) and
// prerendering, which imports the server bundle in the same process. Astro
// deletes every environment's `.vite` folder right after write (see its
// `astro:ssr-assets` plugin), so the manifest cannot be read from disk later.
const MANIFEST_REGISTRY_KEY = '@astrojs/solid-js:client-manifest';
const PERSISTED_MANIFEST_NAME = 'solid-manifest.json';

// Key the registry per project output so multiple builds in one process
// (e.g. test runners building several fixtures) don't read each other's
// manifests.
function manifestRegistryKey(manifestSource: ManifestSource): string {
	return `${MANIFEST_REGISTRY_KEY}:${manifestSource.clientDirs[0] ?? ''}`;
}

function configEnvironmentPlugin(solidNoExternal: string[], manifestSource: ManifestSource): Plugin {
	return {
		name: '@astrojs/solid:config-environment',
		configEnvironment(environmentName) {
			if (environmentName === 'client') {
				return {
					// Emit .vite/manifest.json in the client build so the server
					// render can resolve lazy boundary module assets at runtime.
					build: { manifest: true },
					optimizeDeps: {
						include: ['@astrojs/solid-js/client.js'],
						exclude: ['@astrojs/solid-js/server.js'],
					},
				};
			}
			return {
				// The integration itself must go through Vite in server
				// environments so `virtual:astro-solid-manifest` resolves inside
				// server.js (a bare Node import of it degrades gracefully).
				resolve: { noExternal: [...solidNoExternal, '@astrojs/solid-js'] },
				optimizeDeps: {
					exclude: ['@astrojs/solid-js/server.js'],
				},
			};
		},
		resolveId(id) {
			if (id === VIRTUAL_MANIFEST_ID) return RESOLVED_VIRTUAL_MANIFEST_ID;
		},
		load(id) {
			if (id !== RESOLVED_VIRTUAL_MANIFEST_ID) return;
			const flags = `export const serverComponents = ${manifestSource.serverComponents};\n`;
			if (manifestSource.command !== 'build') {
				// Dev: @solidjs/vite-plugin's virtual manifest exports a live
				// resolver backed by the dev server's module graph; hand it
				// through verbatim (renderToStream accepts resolvers directly).
				return (
					flags +
					`import manifest from 'virtual:solid-manifest';\n` +
					`export function loadManifest() { return manifest; }\n`
				);
			}
			// Build: the server/prerender bundles are created before the client
			// build produces the manifest, so it cannot be baked in. Resolve it
			// lazily at render time: prerendering runs in the build process and
			// finds it in the globalThis registry; a deployed server reads the
			// copy persisted next to the server bundle.
			const fileCandidates = [
				...(manifestSource.serverDir
					? [JSON.stringify(manifestSource.serverDir + PERSISTED_MANIFEST_NAME)]
					: []),
				`new URL(${JSON.stringify('./' + PERSISTED_MANIFEST_NAME)}, import.meta.url)`,
				`new URL(${JSON.stringify('../' + PERSISTED_MANIFEST_NAME)}, import.meta.url)`,
			];
			return (
				flags +
				`import { readFileSync } from 'node:fs';\n` +
				`const base = ${JSON.stringify(manifestSource.base)};\n` +
				`let manifest;\n` +
				`export function loadManifest() {\n` +
				`  if (manifest !== undefined) return manifest;\n` +
				`  manifest = globalThis[Symbol.for(${JSON.stringify(manifestRegistryKey(manifestSource))})];\n` +
				`  if (manifest === undefined) {\n` +
				`    for (const candidate of [${fileCandidates.join(', ')}]) {\n` +
				`      try {\n` +
				`        manifest = JSON.parse(readFileSync(candidate, 'utf-8'));\n` +
				`        break;\n` +
				`      } catch {}\n` +
				`    }\n` +
				`  }\n` +
				`  if (manifest == null) return (manifest = null);\n` +
				`  manifest._base = base;\n` +
				`  return manifest;\n` +
				`}\n`
			);
		},
		writeBundle: {
			sequential: true,
			async handler() {
				// Capture the client manifest before Astro's `astro:ssr-assets`
				// plugin ('post' order) deletes the .vite folder.
				if (this.environment.name !== 'client') return;
				const { readFile, writeFile } = await import('node:fs/promises');
				const { join } = await import('node:path');
				for (const dir of manifestSource.clientDirs) {
					try {
						const raw = await readFile(join(dir, '.vite/manifest.json'), 'utf-8');
						(globalThis as any)[Symbol.for(manifestRegistryKey(manifestSource))] = JSON.parse(raw);
						if (manifestSource.serverDir) {
							// Persist for deployed SSR runtimes, which cannot use the
							// in-process registry. Lives next to the server bundle, so
							// it is not publicly served.
							await writeFile(join(manifestSource.serverDir, PERSISTED_MANIFEST_NAME), raw);
						}
						return;
					} catch {}
				}
			},
		},
	};
}
