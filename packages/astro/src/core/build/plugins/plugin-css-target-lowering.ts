import { createRequire } from 'node:module';
import type { Plugin as VitePlugin, ResolvedConfig } from 'vite';

/**
 * Browser name mapping from esbuild/Vite target format to lightningcss target format.
 * Matches Vite's internal `map` object in `convertTargets`.
 */
const BROWSER_MAP: Record<string, string | false> = {
	chrome: 'chrome',
	edge: 'edge',
	firefox: 'firefox',
	hermes: false,
	ie: 'ie',
	ios: 'ios_saf',
	node: false,
	opera: 'opera',
	rhino: false,
	safari: 'safari',
};

const VERSION_RE = /\d/;

/**
 * Converts esbuild/Vite target strings (e.g. `["safari15", "chrome100"]`) to
 * lightningcss target format (e.g. `{ safari: 983040, chrome: 6553600 }`).
 *
 * This replicates Vite's internal `convertTargets` function, which is not exported.
 */
function convertTargets(esbuildTarget: string | string[] | undefined): Record<string, number> {
	if (!esbuildTarget) return {};
	const targets: Record<string, number> = {};
	const entries = Array.isArray(esbuildTarget) ? esbuildTarget : [esbuildTarget];
	for (const entry of entries) {
		if (entry === 'esnext') continue;
		const index = entry.search(VERSION_RE);
		if (index >= 0) {
			const browserName = entry.slice(0, index);
			const browser = BROWSER_MAP[browserName];
			if (browser === false) continue;
			if (browser) {
				const [major, minor = 0] = entry
					.slice(index)
					.split('.')
					.map((v) => Number.parseInt(v, 10));
				if (!isNaN(major) && !isNaN(minor)) {
					const version = (major << 16) | (minor << 8);
					if (!targets[browser] || version < targets[browser]) {
						targets[browser] = version;
					}
				}
			}
		}
	}
	return targets;
}

/**
 * Vite plugin that applies CSS target lowering without minification.
 *
 * Vite's `finalizeCss` only applies CSS target lowering (via lightningcss) when
 * `config.build.cssMinify` is truthy, because target lowering and minification
 * are coupled in `minifyCSS`. When users set `minify: false`, Astro forces
 * `cssMinify: false`, which disables target lowering for all CSS.
 *
 * This plugin fills that gap: when `cssMinify` is falsy and a CSS target is
 * configured, it runs lightningcss with `minify: false` on all CSS assets in
 * `generateBundle`, applying target lowering without minification.
 */
export function pluginCssTargetLowering(): VitePlugin {
	let resolvedConfig: ResolvedConfig;

	return {
		name: 'astro:css-target-lowering',
		enforce: 'post',

		configResolved(config) {
			resolvedConfig = config;
		},

		async generateBundle(_outputOptions, bundle) {
			// Only apply when cssMinify is disabled and a CSS target is configured
			if (resolvedConfig.build.cssMinify) return;
			const cssTarget = resolvedConfig.build.cssTarget;
			if (!cssTarget) return;

			const targets = convertTargets(cssTarget);
			if (Object.keys(targets).length === 0) return;

			// Resolve lightningcss from Vite's dependencies (it's not a direct Astro dep)
			let lcssTransform: (opts: Record<string, unknown>) => {
				code: Uint8Array;
				warnings: unknown[];
			};
			try {
				const requireFromVite = createRequire(import.meta.resolve('vite'));
				lcssTransform = (requireFromVite('lightningcss') as { transform: typeof lcssTransform })
					.transform;
			} catch {
				// If lightningcss is not available, skip silently
				return;
			}

			for (const [, asset] of Object.entries(bundle)) {
				if (asset.type !== 'asset') continue;
				if (!asset.fileName.endsWith('.css')) continue;
				if (typeof asset.source !== 'string') continue;

				try {
					const result = lcssTransform({
						...resolvedConfig.css?.lightningcss,
						targets,
						cssModules: undefined,
						filename: asset.fileName,
						code: Buffer.from(asset.source),
						minify: false,
					});
					asset.source = new TextDecoder().decode(result.code);
				} catch {
					// If transformation fails, leave the CSS unchanged
				}
			}
		},
	};
}
