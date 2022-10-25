import { Plugin as VitePlugin } from 'vite';
import { AstroSettings } from '../@types/astro.js';
import ancestor from 'common-ancestor-path';
import { isPage, isEndpoint } from '../core/util.js';
import * as eslexer from 'es-module-lexer';

const VALID_OUTPUT = new Set(['static', 'server']);
export default function astroOutputPlugin({ settings }: { settings: AstroSettings }): VitePlugin {
	function normalizeFilename(filename: string) {
		if (filename.startsWith('/@fs')) {
			filename = filename.slice('/@fs'.length);
		} else if (filename.startsWith('/') && !ancestor(filename, settings.config.root.pathname)) {
			filename = new URL('.' + filename, settings.config.root).pathname;
		}
		return filename;
	}
	
	return {
		name: 'astro:output',
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
			if (!code.includes('output')) return;

			await eslexer.init;
			const [_, exports] = eslexer.parse(code, id);
			let output: string | undefined;
			for (const e of exports) {
				if (e.n === 'output') {
					let expr = code.slice(e.le).trim().replace(/\=/, '').trim().split(/[;\n]/)[0];
					let value = expr;
					if (expr.at(0) === expr.at(-1)) {
						value = expr.slice(1, -1);
					}
					if (!VALID_OUTPUT.has(value)) {
						throw new Error(`Invalid export "output" value ${expr}!`);
					}
				}
			}

			if (!output) return;

			const { meta = {} } = this.getModuleInfo(id) ?? {};
			if (meta.astro) {
				meta.astro.output = output;
			}

			return {
				code,
				meta
			};
		},
	};
}
