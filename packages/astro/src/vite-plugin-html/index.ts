import type { Plugin, ResolvedConfig } from '../core/vite';
import type { AstroConfig, Renderer } from '../@types/astro';
import type { LogOptions } from '../core/logger';

import { promises as fs } from 'fs';

interface AstroPluginJSXOptions {
	config: AstroConfig;
	logging: LogOptions;
}

/** Use Astro config to allow for alternate or multiple JSX renderers (by default Vite will assume React) */
export default function html({ config, logging }: AstroPluginJSXOptions): Plugin {
	return {
		name: '@astrojs/vite-plugin-html',
		enforce: 'pre', // run transforms before other plugins
		async load(id) {
			if (/\.html/.test(id)) {
				const content = await fs.readFile(id).then(res => res.toString());
				return `export default \`${content}\``;
			}
			return null;
		},
	};
}
