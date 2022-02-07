import type { Plugin } from '../core/vite';
import * as fs from 'node:fs/promises';

export const SPECIAL_QUERY_RE = /[\?&](?:worker|sharedworker|raw|url)\b/

/** Use Astro config to allow for alternate or multiple JSX renderers (by default Vite will assume React) */
export default function createSvgPlugin(): Plugin {
  const svgRegex = /\.svg$/

	return { 
		name: 'astro:jsx',
		enforce: 'pre', // run transforms before other plugins
    async resolveId (id, source, ...options) {
      if (!id.match(svgRegex)) {
				return null;
			}
			const resolution = await this.resolve(id, source, { skipSelf: true, ...options });
			return resolution;
    },
    async load (id) {
			console.log(id);
      if (!id.match(svgRegex)) {
				return null;
			}
      let svg = await fs.readFile(id, 'utf-8');
			console.log(svg);
			return `export default ${JSON.stringify(svg)}`
		}
	};
}
