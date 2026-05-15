import fs from 'node:fs';
import { appendForwardSlash } from '../path.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import { getHandles, resetHandles } from '../../assets/utils/assets.js';
import { getOrCreateSSRAssets } from './internal.js';
function vitePluginSSRAssets(internals) {
	return {
		name: 'astro:ssr-assets',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		configEnvironment(name) {
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
			resetHandles(this.environment);
		},
		generateBundle() {
			const env = this.environment;
			const handles = getHandles(env);
			const filenames = getOrCreateSSRAssets(internals, env.name);
			if (handles) {
				for (const handle of handles) {
					try {
						const filename = this.getFileName(handle);
						filenames.add(filename);
					} catch {}
				}
			}
		},
		writeBundle: {
			sequential: true,
			order: 'post',
			async handler() {
				const env = this.environment;
				const manifestDir = new URL(appendForwardSlash(`file://${env.config.build.outDir}`));
				const manifest = loadViteManifest(manifestDir);
				if (manifest) {
					const manifestAssets = collectAssetsFromManifest(manifest);
					if (manifestAssets.size > 0) {
						const filenames = getOrCreateSSRAssets(internals, env.name);
						for (const asset of manifestAssets) {
							filenames.add(asset);
						}
					}
				}
				await deleteViteFolder(env.config.build.outDir);
			},
		},
	};
}
function loadViteManifest(directory) {
	const manifestPath = new URL('.vite/manifest.json', appendForwardSlash(directory.toString()));
	if (!fs.existsSync(manifestPath)) {
		return null;
	}
	const contents = fs.readFileSync(manifestPath, 'utf-8');
	return JSON.parse(contents);
}
function collectAssetsFromManifest(manifest) {
	const assets = /* @__PURE__ */ new Set();
	for (const chunk of Object.values(manifest)) {
		if (chunk.css) {
			for (const css of chunk.css) {
				assets.add(css);
			}
		}
		if (chunk.assets) {
			for (const asset of chunk.assets) {
				assets.add(asset);
			}
		}
		if (chunk.file.endsWith('.css')) {
			assets.add(chunk.file);
		}
	}
	return assets;
}
async function deleteViteFolder(directory) {
	const viteFolder = new URL('.vite/', appendForwardSlash(`file://${directory}`));
	if (fs.existsSync(viteFolder)) {
		await fs.promises.rm(viteFolder, { recursive: true, force: true });
	}
}
export { vitePluginSSRAssets };
