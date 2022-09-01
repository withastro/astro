import type * as vite from 'vite';
import type { AstroConfig, ManifestData } from '../@types/astro';
import { error, info, LogOptions, warn } from '../core/logger/core.js';

interface AstroPluginOptions {
	config: AstroConfig;
	logging: LogOptions;
}

export default function createPlugin({ config, logging }: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:client-directive',
		transform(code, id, opts = {}) {
			let idx = id.indexOf('?astro-client-directive');
			if(idx !== -1) {
				let entrypoint = id.slice(0, idx);
				let params = new URLSearchParams(id.slice(idx));
				let directive = params.get('astro-client-directive');
				return `
import directive from '${entrypoint}';

(self.Astro = self.Astro || {}).${directive} = directive;
window.dispatchEvent(new Event('astro:${directive}'));
`.trim()
			}

			/*if (opts.ssr) return;
			if (!id.includes('vite/dist/client/client.mjs')) return;
			return code
				.replace(/\.tip \{[^}]*\}/gm, '.tip {\n  display: none;\n}')
				.replace(/\[vite\]/g, '[astro]');*/
		},
	};
}
