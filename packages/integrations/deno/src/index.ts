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
		exports: ['stop', 'handle', 'start', 'running'],
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
				if (target === 'server') {
					vite.resolve = vite.resolve || {};
					vite.resolve.alias = vite.resolve.alias || {};

					const aliases = [{ find: 'react-dom/server', replacement: 'react-dom/server.browser' }];

					if (Array.isArray(vite.resolve.alias)) {
						vite.resolve.alias = [...vite.resolve.alias, ...aliases];
					} else {
						for (const alias of aliases) {
							(vite.resolve.alias as Record<string, string>)[alias.find] = alias.replacement;
						}
					}

					vite.ssr = {
						noExternal: true,
					};
				}
			},
		},
	};
}
