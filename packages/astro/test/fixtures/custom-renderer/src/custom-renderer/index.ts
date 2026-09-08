import type { AstroIntegration, AstroRenderer } from 'astro';

const getRenderer = (): AstroRenderer => ({
    name: 'custom-renderer',
    clientEntrypoint: '@custom-renderer/client',
    serverEntrypoint: '@custom-renderer/server',
})

export { getRenderer as getContainerRenderer };

export default function (): AstroIntegration {
	return {
		name: 'custom-renderer',
		hooks: {
			'astro:config:setup': ({ addRenderer }) => {
				addRenderer(getRenderer());
			},
		},
	};
}
