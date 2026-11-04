import type { AstroRenderer } from 'astro';
import { getRenderer } from './container-renderer.js';
import type { RendererOptions } from './types.js';

export interface PreactRendererOptions extends RendererOptions {
	/**
	 * Renders React components with `preact/compat`. Set it with the `reactAliasesEnabled` option of
	 * `@preact/preset-vite`, which aliases `react` and `react-dom` to it.
	 */
	compat?: boolean;
	/** Dev only: loads `preact/debug` on every page, for the Preact Devtools. */
	devtools?: boolean;
}

/**
 * Returns the Preact renderer for `astro({ renderers: [preact()] })` from
 * `@astrojs/vite-plugin-astro`: plain data, applied by `astro()`. Compiling JSX is the job of
 * `@preact/preset-vite`, added to the Vite `plugins` next to `astro()`.
 */
export default function preact(options: PreactRendererOptions = {}): AstroRenderer {
	const { include, exclude, compat, devtools } = options;
	const clientDependencies = [
		'@astrojs/preact/client.js',
		'preact',
		'preact/jsx-runtime',
		'preact/hooks',
		'@astrojs/preact > @preact/signals',
	];
	return {
		...getRenderer(false),
		options: { include, exclude } satisfies RendererOptions,
		optimizeDeps: {
			client: {
				include: compat
					? [
							...clientDependencies,
							'preact/compat',
							'preact/test-utils',
							'preact/compat/jsx-runtime',
						]
					: clientDependencies,
			},
		},
		...(compat && { dedupe: ['preact/compat', 'preact'] }),
		// `/@id/` makes Vite's dev server resolve the bare specifier.
		...(devtools && { devHeadScript: 'import "__BASE__@id/preact/debug";' }),
	};
}
