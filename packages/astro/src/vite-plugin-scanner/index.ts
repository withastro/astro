import { Plugin as VitePlugin } from 'vite';
import { AstroSettings } from '../@types/astro.js';
import ancestor from 'common-ancestor-path';
import { isPage, isEndpoint } from '../core/util.js';
import * as eslexer from 'es-module-lexer';
import { PageOptions } from '../vite-plugin-astro/types.js';

const BOOLEAN_EXPORTS = new Set(['prerender']);

// Quick scan to determine if code includes recognized export
// False positives are not a problem, so be forgiving!
function includesExport(code: string) {
	for (const name of BOOLEAN_EXPORTS) {
		if (code.includes(name)) return true;
	}
	return false;
}

export default function astroScannerPlugin({ settings }: { settings: AstroSettings }): VitePlugin {
	function normalizeFilename(filename: string) {
		if (filename.startsWith('/@fs')) {
			filename = filename.slice('/@fs'.length);
		} else if (filename.startsWith('/') && !ancestor(filename, settings.config.root.pathname)) {
			filename = new URL('.' + filename, settings.config.root).pathname;
		}
		return filename;
	}
	
	return {
		name: 'astro:scanner',
		enforce: 'post',

		async transform(this, code, id, options) {
			if (!options?.ssr) return;

			const filename = normalizeFilename(id);
			let fileURL: URL;
			try {
				fileURL = new URL(`file://${filename}`);
			} catch (e) {
				// If we can't construct a valid URL, exit early
				return;
			}

			const fileIsPage = isPage(fileURL, settings);
			const fileIsEndpoint = isEndpoint(fileURL, settings);
			if (!(fileIsPage || fileIsEndpoint)) return;
			if (!includesExport(code)) return;

			await eslexer.init;
			const [_, exports] = eslexer.parse(code, id);
			let pageOptions: PageOptions = {};
			for (const e of exports) {
				if (BOOLEAN_EXPORTS.has(e.n)) {
					pageOptions[e.n as keyof PageOptions] = true;
					
					let expr = code.slice(e.le).trim().replace(/\=/, '').trim().split(/[;\n]/)[0];
					if (expr !== 'true') {
						// TODO: warn
					}
				}
			}

			const { meta = {} } = this.getModuleInfo(id) ?? {};
			if (!meta.astro) meta.astro = { hydratedComponents: [], clientOnlyComponents: [], scripts: [], pageOptions: {} };
			meta.astro.pageOptions = pageOptions;

			return {
				code,
				meta
			};
		},
	};
}
