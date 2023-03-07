import type { AstroAdapter, AstroIntegration } from 'astro';

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/timer',
		serverEntrypoint: '@astrojs/timer/server.js',
		previewEntrypoint: '@astrojs/timer/preview.js',
		exports: ['handler'],
	};
}

export default function createIntegration(): AstroIntegration {
	return {
		name: '@astrojs/timer',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					vite: {
						ssr: {
							noExternal: ['@astrojs/timer'],
						},
					},
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter());

				if (config.output === 'static') {
					console.warn(`[@astrojs/timer] \`output: "server"\` is required to use this adapter.`);
				}
			},
		},
	};
}
