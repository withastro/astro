import type { Plugin } from 'vite';
import type { Logger } from '../core/logger/core.js';
import { isAstroClientEnvironment } from '../environments.js';

const CODE_COMPONENT_MODULE = 'astro:components/Code';
const DEBUG_COMPONENT_MODULE = 'astro:components/Debug';
const ASTRO_COMPONENTS = 'astro:components';
const RESOLVED_ASTRO_COMPONENTS = '\0' + ASTRO_COMPONENTS;

type Options = {
	logger: Logger;
};

export function astroComponentsVitePlugin({ logger }: Options): Plugin {
	return {
		name: '@astrojs/astro-components',
		resolveId: {
			filter: {
				id: new RegExp(`^${CODE_COMPONENT_MODULE}|${DEBUG_COMPONENT_MODULE}|${ASTRO_COMPONENTS}$`),
			},
			async handler(id) {
				if (isAstroClientEnvironment(this.environment)) {
					// TODO: better error
					throw new Error("Astro components can't be imported on the client");
				}

				if (id === CODE_COMPONENT_MODULE) {
					return this.resolve('astro/components/Code.astro');
				} else if (id === DEBUG_COMPONENT_MODULE) {
					return this.resolve('astro/components/Debug.astro');
				} else if (id === ASTRO_COMPONENTS) {
					return RESOLVED_ASTRO_COMPONENTS;
				}
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_ASTRO_COMPONENTS}$`),
			},
			handler(id) {
				if (id === RESOLVED_ASTRO_COMPONENTS) {
					logger.warn(
						'deprecated',
						'The use of barrel specifier `astro:components` is deprecated and discouraged. Import the component directly instead.',
					);
					return {
						code: `
							export { default as Code } from "astro/components/Code.astro";
							export { default as Debug } from "astro/components/Debug.astro";
						`,
					};
				}
			},
		},
	};
}
