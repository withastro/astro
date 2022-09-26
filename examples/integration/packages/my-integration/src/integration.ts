import type { AstroIntegration } from 'astro';
import pkg from '../package.json';

export default function createIntegration(): AstroIntegration {
	return {
		name: pkg.name,
		hooks: {
			'astro:config:setup': ({
				config,
				command,
				updateConfig,
				addRenderer,
				injectScript,
				injectRoute,
			}) => {
				// Used to extend the project config. This includes updating the Astro config,
				// applying Vite plugins, adding component renderers, and injecting scripts onto the page.
				console.log('astro:config:setup');
			},
			'astro:server:setup': ({ server }) => {
				// Used to update Vite server options and middleware.
				console.log('astro:server:setup');
			},
			'astro:build:start': ({ buildConfig }) => {
				// Used to set up any global objects or clients needed during a production build.
				// This can also extend the build configuration options in the adapter API.
				console.log('astro:build:start');
			},
			'astro:build:done': ({ dir, routes }) => {
				// Used to access generated routes and assets for extension (ex. copy content into the generated /assets directory).
				// If you plan to transform generated assets, we recommend exploring the Vite Plugin API and
				// configuring via astro:config:setup instead.
				console.log('astro:build:done');
			},
		},
	};
}
