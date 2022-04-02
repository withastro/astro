import type { AstroIntegration } from 'astro';

export default function createPlugin(): AstroIntegration {
	return {
		name: '@astrojs/turbolinks',
		hooks: {
			'astro:config:setup': ({ injectScript }) => {
				// This gets injected into the user's page, so we need to re-export Turbolinks
				// from our own package so that package managers like pnpm don't get mad and
				// can follow the import correctly.
				injectScript(
					'page',
					`import {Turbolinks} from "@astrojs/turbolinks/client.js"; Turbolinks.start();`
				);
			},
		},
	};
}
