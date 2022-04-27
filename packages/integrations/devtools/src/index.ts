import type { AstroIntegration } from 'astro';

export interface AstroDevToolsOptions {
	schema?: string;
}

export default function (opts: AstroDevToolsOptions): AstroIntegration {
	return {
		name: '@astrojs/devtools',
		hooks: {
			'astro:config:setup': ({ command, injectScript }) => {
				if (command !== 'dev') return;

				injectScript(
					'page',
					`import { AstroDevTools } from "@astrojs/devtools/client"; AstroDevTools.init();`
				);
			}
		},
	};
}
