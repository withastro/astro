import type { AstroAdapter, AstroIntegration } from 'astro';

export function getAdapter(): AstroAdapter {
	return {
		name: '@benchmark/timer',
		serverEntrypoint: '@benchmark/timer/server.js',
		previewEntrypoint: '@benchmark/timer/preview.js',
		exports: ['handler'],
	};
}

export default function createIntegration(): AstroIntegration {
	return {
		name: '@benchmark/timer',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					vite: {
						ssr: {
							noExternal: ['@benchmark/timer'],
						},
					},
				});
			},
			'astro:config:done': ({ setAdapter, config }) => {
				setAdapter(getAdapter());

				if (config.output === 'static') {
					// eslint-disable-next-line no-console
					console.warn(`[@benchmark/timer] \`output: "server"\` is required to use this adapter.`);
				}
			},
		},
	};
}
