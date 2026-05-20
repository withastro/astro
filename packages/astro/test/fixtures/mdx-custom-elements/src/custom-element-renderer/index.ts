import type { AstroIntegration, AstroRenderer } from 'astro';

const getRenderer = (): AstroRenderer => ({
	name: 'custom-element-renderer',
	serverEntrypoint: '@custom-element-renderer/server',
});

export default function (): AstroIntegration {
	return {
		name: 'custom-element-renderer',
		hooks: {
			'astro:config:setup': ({ addRenderer }) => {
				addRenderer(getRenderer());
			},
		},
	};
}
