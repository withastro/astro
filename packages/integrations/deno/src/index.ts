import type { AstroAdapter, AstroIntegration } from 'astro';

interface Options {
	port?: number;
	hostname?: string;
}

export function getAdapter(args?: Options): AstroAdapter {
	return {
		name: '@astrojs/deno',
		serverEntrypoint: '@astrojs/deno/server.js',
		args: args ?? {},
		exports: ['stop', 'handle']
	};
}

export default function createIntegration(args?: Options): AstroIntegration {
	return {
		name: '@astrojs/deno',
		hooks: {
			'astro:config:done': ({ setAdapter }) => {
				setAdapter(getAdapter(args));
			},
			'astro:build:setup': ({ vite, target }) => {
				if(target === 'server') {
					vite.ssr = {
						noExternal: true
					};
				}
			}
		},
	};
}
