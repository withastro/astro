import type { AstroAdapter, AstroIntegration } from '../@types/astro';

export function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/ssg',
		// This one has no server entrypoint and is mostly just an integration
		//serverEntrypoint: '@astrojs/ssg/server.js',
	};
}

export default function createIntegration(): AstroIntegration {
	return {
		name: '@astrojs/ssg',
		hooks: {
			'astro:config:done': ({ setAdapter }) => {
				setAdapter(getAdapter());
			},
			'astro:build:start': ({ buildConfig }) => {
				buildConfig.staticMode = true;
			}
		}
	};
}
