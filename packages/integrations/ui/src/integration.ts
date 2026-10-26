import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';
import { RUNTIME, transformAstro } from './transform.js';

export default function ui(): AstroIntegration {
	return {
		name: '@astrojs/ui',
		hooks: {
			'astro:config:setup'({ config, updateConfig, injectScript }) {
				const root = fileURLToPath(config.root);
				// Revive bound signals on every page, even ones without scoped scripts.
				injectScript('page', `import '${RUNTIME}';`);
				updateConfig({ vite: { plugins: [vitePlugin(root)] } });
			},
		},
	};
}

function vitePlugin(root: string): Plugin {
	return {
		name: '@astrojs/ui:transform',
		enforce: 'pre',
		// A load hook rather than transform, so we see the .astro source before
		// Astro's own plugin compiles it, whatever order plugins are in.
		async load(id) {
			if (!id.endsWith('.astro')) return;
			const source = await readFile(id, 'utf8');
			if (!source.includes('{') && !source.includes('scoped')) return;
			this.addWatchFile(id);
			return transformAstro(source, path.relative(root, id).split(path.sep).join('/'));
		},
	};
}
