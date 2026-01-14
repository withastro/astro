import type { AstroIntegration, HookParameters } from 'astro';

export default function createIntegration(): AstroIntegration {
	return {
		name: '@benchmark/timer',
		hooks: {
			'astro:config:setup': ({ updateConfig }: HookParameters<'astro:config:setup'>) => {
				updateConfig({
					vite: {
						ssr: {
							noExternal: ['@benchmark/timer'],
						},
					},
				});
			},
			'astro:config:done': ({ setAdapter }: HookParameters<'astro:config:done'>) => {
				setAdapter({
					name: '@benchmark/adapter',
					serverEntrypoint: '@benchmark/adapter/server.js',
					exports: ['manifest', 'createApp'],
					supportedAstroFeatures: {
						serverOutput: 'stable',
						envGetSecret: 'experimental',
						staticOutput: 'stable',
						hybridOutput: 'stable',
						i18nDomains: 'stable',
					},
				});
			},
		},
	};
}
