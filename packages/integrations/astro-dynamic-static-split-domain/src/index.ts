import type { AstroIntegration } from 'astro';
import { AstroError } from 'astro/errors';

export interface UserOptions {
	serverIslandDynamicBase?: string;
}

export default function createIntegration(userOptions: UserOptions): AstroIntegration {
	if (!userOptions?.serverIslandDynamicBase) {
		throw new AstroError(`Setting the 'serverIslandDynamicBase' option is required.`);
	}

	return {
		name: 'astro-dynamic-static-split-domain',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, command }) => {
				if (command === 'build') {
					updateConfig({
						serverIslandDynamicBase:
							config.serverIslandDynamicBase ?? userOptions.serverIslandDynamicBase,
					});
				}
			},
		},
	};
}
