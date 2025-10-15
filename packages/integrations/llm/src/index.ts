import type { AstroIntegration } from 'astro';

export interface LLMOptions {
	// Options will be added as we implement features
}

const PKG_NAME = '@astrojs/llm';

const createPlugin = (options?: LLMOptions): AstroIntegration => {
	return {
		name: PKG_NAME,

		hooks: {
			'astro:config:setup': ({ addMiddleware }) => {
				addMiddleware({
					entrypoint: '@astrojs/llm/middleware',
					order: 'post',
				});
			},

			'astro:build:done': async ({ dir, routes, pages, logger }) => {
				// Build-time hook for generating llms.txt
			},
		},
	};
};

export default createPlugin;
