import fs from 'node:fs';
import type { EnvironmentOptions, Plugin } from 'vite';
import type * as vite from 'vite';
import { appendForwardSlash } from '../path.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import { getHandles, resetHandles } from '../../assets/utils/assets.js';
import { getOrCreateSSRAssets, type BuildInternals } from './internal.js';

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
			resetHandles(this.environment);
		},

		generateBundle() {
			const env = this.environment;
			const handles = getHandles(env);
			const filenames = getOrCreateSSRAssets(internals, env.name);

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

				// Add CSS and assets from manifest (these are always client assets)
				// Must be done in writeBundle because the manifest is written during the bundle write phase
				const manifestDir = new URL(appendForwardSlash(`file://${env.config.build.outDir}`));
				const manifest = loadViteManifest(manifestDir);
				if (manifest) {
					const manifestAssets = collectAssetsFromManifest(manifest);
					if (manifestAssets.size > 0) {
						// Append manifest assets to internals.ssrAssetsPerEnvironment for this environment
						const filenames = getOrCreateSSRAssets(internals, env.name);
						for (const asset of manifestAssets) {
							filenames.add(asset);
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
 * Collects client asset filenames from a Vite manifest.
 * This includes CSS files and other assets (fonts, images) that need to be
 * moved to the client directory.
 */
function collectAssetsFromManifest(manifest: vite.Manifest): Set<string> {
	const assets = new Set<string>();
	for (const chunk of Object.values(manifest)) {
		// Add CSS files listed in the css array
		if (chunk.css) {
			for (const css of chunk.css) {
				assets.add(css);
			}
		}
		// Add assets (fonts, images referenced from CSS, etc.)
		if (chunk.assets) {
			for (const asset of chunk.assets) {
				assets.add(asset);
			}
		}
		// Add CSS files that are the primary output of a chunk
		// This happens when a JS module only imports CSS and has no JS output
		if (chunk.file.endsWith('.css')) {
			assets.add(chunk.file);
		}
	}
	return assets;
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
