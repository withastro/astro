import { type Plugin as VitePlugin } from 'vite';
import { type BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';

function vitePluginContent(
	opts: StaticBuildOptions,
	internals: BuildInternals
): VitePlugin {
	const { config } = opts.settings;
	const distRoot = config.outDir;
	console.log("DEBUG", distRoot)
	console.log("DEBUG", internals)

	// // console.log('DEBUG', this.settings.resolvedInjectedAssets);
	// this.logger.info('assets', 'Injecting assets...');
	// for (const resolvedAsset of this.settings.resolvedInjectedAssets) {
	// 	const assetsPath = resolvedAsset.outDir ?? this.settings.config.build.assets;
	// 	let assetName = resolvedAsset.outName ?? resolvedAsset.resolvedEntryPoint.pathname.substring(resolvedAsset.resolvedEntryPoint.pathname.lastIndexOf('/') + 1)
	// 	if (resolvedAsset.addHash) {
	// 		assetName = `${assetName.split('.')}.${resolvedAsset.hash}`;
	// 	}
	// 	const assetURL = new URL(
	// 		`./${assetsPath}/${assetName}`,
	// 		appendForwardSlash(opts.settings.config.outDir.toString())
	// 	);
	// 	// console.log(assetURL);
	// 	try {
	// 		fs.promises.copyFile(fileURLToPath(resolvedAsset.resolvedEntryPoint), assetURL);
	// 	} catch (error) { }
	// }
	return {
		name: '@astro/plugin-inject-assets',
	};
}

export function pluginInjectAssets(
	opts: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {

	return {
		targets: ['server'],
		hooks: {
			async 'build:before'() {
				console.log("DEBUG BEFORE", opts.settings.resolvedInjectedAssets)

				return {
					vitePlugin: vitePluginContent(opts, internals),
				};
			},
		},
	};
}
