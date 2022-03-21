import type { AstroConfig, AstroAdapter, AstroIntegration } from 'astro';

function getAdapter(): AstroAdapter {
	return {
		name: '@astrojs/ssg',
		// This one has no server entrypoint and is mostly just an integration
		//serverEntrypoint: '@astrojs/ssg/server.js',
	};
}

export default function createPlugin(): AstroIntegration {
	return {
		name: '@astrojs/ssg',
		hooks: {
			'astro:config:setup'({ setAdapter }) {
				setAdapter(getAdapter());
			},
		}
	}
}
