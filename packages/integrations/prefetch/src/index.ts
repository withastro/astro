import type { AstroIntegration } from 'astro';
import type { PrefetchOptions } from './client.js';

export default function (options: PrefetchOptions = {}): AstroIntegration {
	return {
		name: '@astrojs/prefetch',
		hooks: {
			'astro:config:setup': ({ updateConfig, addRenderer, injectScript }) => {
				// Inject the necessary polyfills on every page (inlined for speed).
				injectScript(
					'page',
					`import prefetch from "@astrojs/prefetch/client.js"; prefetch(${JSON.stringify(
						options
					)});`
				);
			},
		},
	};
}
