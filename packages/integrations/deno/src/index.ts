import type { AstroAdapter, AstroIntegration } from 'astro';



export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/deno',
		serverEntrypoint: '@astrojs/deno/server.js',
	};
}

export default function createIntegration(): AstroIntegration {
	return {
		name: '@astrojs/deno',
		hooks: {
			'astro:config:setup': ({ config, command }) => {
			},
			'astro:config:done': ({ setAdapter }) => {
				setAdapter(getAdapter());
			},
			'astro:build:server:setup': ({ vite }) => {
				Object.assign(vite, {
					resolve: {
						...(vite.resolve ?? {}),
						alias: {
							...(vite.resolve?.alias ?? {}),
							'events': 'events-browserify-mfsu',
							'path': 'path-browserify',
							'tty': 'tty-browserify'
						}
					},
					ssr: {
						...(vite.ssr ?? {})
					},
				})
				vite.ssr = {
					noExternal: true
				};

			}
		},
	};
}
