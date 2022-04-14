import type { AstroAdapter, AstroIntegration } from 'astro';

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/node',
		serverEntrypoint: '@astrojs/node/server.js',
		exports: ['handler'],
	};
}

export default function createIntegration(): AstroIntegration {
	return {
		name: '@astrojs/node',
		hooks: {
			'astro:config:done': ({ setAdapter }) => {
				setAdapter(getAdapter());
			}
		},
	};
}
