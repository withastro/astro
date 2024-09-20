import { readFileSync } from 'node:fs';
import type { AstroSettings, ManifestData } from '../types/astro.js';
import { TYPES_FILE, TYPES_TEMPLATE_URL } from './constants.js';
import { removeTrailingForwardSlash, appendForwardSlash } from '@astrojs/internal-helpers/path';

export function syncTypedLinks(settings: AstroSettings, manifest: ManifestData): void {
	if (!settings.config.experimental.typedLinks) {
		return;
	}

	const data: Array<{ route: string; params: Array<string> }> = [];

	const { base, trailingSlash } = settings.config;
	for (const { route: _route, params } of manifest.routes) {
		const route = `${removeTrailingForwardSlash(base)}${_route}`;
		if (trailingSlash === 'always') {
			data.push({ route: appendForwardSlash(route), params });
		} else if (trailingSlash === 'never') {
			data.push({ route, params });
		} else {
			const r = appendForwardSlash(route);
			data.push({ route, params });
			if (route !== r) {
				data.push({ route: r, params });
			}
		}
	}

	let types = '';
	for (let i = 0; i < data.length; i++) {
		const { route, params } = data[i];

		if (i > 0) {
			types += '		';
		}

		types += `"${route}": ${
			params.length === 0
				? 'never'
				: `{${params
						.map((key) => `"${key}": ${key.startsWith('...') ? 'string | undefined' : 'string'}`)
						.join('; ')}}`
		};`;

		if (i !== data.length - 1) {
			types += '\n';
		}
	}

	const content = readFileSync(TYPES_TEMPLATE_URL, 'utf-8').replace('// @@LINKS@@', types);
	settings.injectedTypes.push({
		filename: TYPES_FILE,
		content,
	});
}
