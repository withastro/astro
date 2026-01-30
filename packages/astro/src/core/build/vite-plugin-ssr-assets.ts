import fs from 'node:fs';
import type { Environment, EnvironmentOptions, Plugin, Rollup } from 'vite';
import type * as vite from 'vite';
import { appendForwardSlash } from '../path.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import type { BuildInternals } from './internal.js';

type PluginContext = Rollup.PluginContext;
type EmitFileOptions = Parameters<Rollup.PluginContext['emitFile']>[0];

// WeakMap keyed by Environment objects to track emitted asset handles
// Using WeakMap ensures automatic cleanup when environments are garbage collected
const assetHandlesByEnvironment = new WeakMap<Environment, Set<string>>();

/**
 * Gets or creates the handle set for an environment
 */
function getHandles(env: Environment): Set<string> {
	let handles = assetHandlesByEnvironment.get(env);
	if (!handles) {
		handles = new Set();
		assetHandlesByEnvironment.set(env, handles);
	}
	return handles;
}

/**
 * Vite plugin that tracks emitted assets and handles cleanup of manifest files.
 * This plugin coordinates with emitClientAsset() to track which assets should
 * be moved to the client directory. The resolved filenames are stored in
 * BuildInternals.ssrAssetsPerEnvironment during generateBundle.
 */
export function vitePluginSSRAssets(internals: BuildInternals): Plugin {
	return {
		name: 'astro:ssr-assets',

		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},

		configEnvironment(name): EnvironmentOptions | undefined {
			// Enable manifest generation for SSR and prerender environments
			// so we can read CSS files from the manifest
			if (
				name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			) {
				return {
					build: {
						manifest: true,
					},
				};
			}
		},

		buildStart() {
			// Reset tracking for this environment at the start of each build
			const env = this.environment;
			assetHandlesByEnvironment.set(env, new Set());
		},

		generateBundle() {
			const env = this.environment;
			const envName = env.name;
			const handles = assetHandlesByEnvironment.get(env);

			// Get or create the filenames set in internals for this environment
			let filenames = internals.ssrAssetsPerEnvironment.get(envName);
			if (!filenames) {
				filenames = new Set();
				internals.ssrAssetsPerEnvironment.set(envName, filenames);
			}

			// Resolve handles to filenames and store in internals
			if (handles) {
				for (const handle of handles) {
					try {
						const filename = this.getFileName(handle);
						filenames.add(filename);
					} catch {
						// Handle may be invalid if emitFile failed, skip it
					}
				}
			}
		},

		writeBundle: {
			sequential: true,
			order: 'post',
			async handler() {
				const env = this.environment;
				const envName = env.name;

				// Get or create the filenames set in internals for this environment
				let filenames = internals.ssrAssetsPerEnvironment.get(envName);
				if (!filenames) {
					filenames = new Set();
					internals.ssrAssetsPerEnvironment.set(envName, filenames);
				}

				// Add CSS and assets from manifest (these are always client assets)
				// Must be done in writeBundle because the manifest is written during the bundle write phase
				const manifestDir = new URL(appendForwardSlash(`file://${env.config.build.outDir}`));
				const manifest = loadViteManifest(manifestDir);
				if (manifest) {
					for (const chunk of Object.values(manifest)) {
						if (chunk.css) {
							for (const css of chunk.css) {
								filenames.add(css);
							}
						}
						// Also add assets (fonts, images referenced from CSS, etc.)
						if (chunk.assets) {
							for (const asset of chunk.assets) {
								filenames.add(asset);
							}
						}
					}
				}

				// Clean up the .vite folder after the bundle is written
				await deleteViteFolder(env.config.build.outDir);
			},
		},
	};
}

/**
 * Emit a client asset and track it for later movement to the client directory.
 * Use this instead of pluginContext.emitFile for assets that should
 * be moved from the server/prerender directory to the client directory.
 *
 * Note: The pluginContext is typed as Rollup.PluginContext for compatibility
 * with content entry types, but in practice it will always have the `environment`
 * property when running in Vite.
 */
export function emitClientAsset(pluginContext: PluginContext, options: EmitFileOptions): string {
	const env = (pluginContext as PluginContext & { environment: Environment }).environment;
	const handle = pluginContext.emitFile(options);

	const handles = getHandles(env);
	handles.add(handle);

	return handle;
}

/**
 * Get the set of asset filenames that should be moved to the client directory
 * for a given environment.
 */
export function getClientAssets(internals: BuildInternals, envName: string): Set<string> {
	return internals.ssrAssetsPerEnvironment.get(envName) ?? new Set();
}

/**
 * Loads a Vite manifest from a directory if it exists.
 */
function loadViteManifest(directory: URL): vite.Manifest | null {
	const manifestPath = new URL('.vite/manifest.json', appendForwardSlash(directory.toString()));
	if (!fs.existsSync(manifestPath)) {
		return null;
	}
	const contents = fs.readFileSync(manifestPath, 'utf-8');
	return JSON.parse(contents) as vite.Manifest;
}

/**
 * Deletes the .vite folder from a directory if it exists.
 */
async function deleteViteFolder(directory: string): Promise<void> {
	const viteFolder = new URL('.vite/', appendForwardSlash(`file://${directory}`));
	if (fs.existsSync(viteFolder)) {
		await fs.promises.rm(viteFolder, { recursive: true, force: true });
	}
}
