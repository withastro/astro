import fsMod from 'node:fs';
import type { AstroSettings } from '../@types/astro.js';
import { TYPES_TEMPLATE_URL } from './constants.js';
import { getEnvFieldType } from './validators.js';

export function syncAstroEnv(settings: AstroSettings, fs = fsMod): void {
	if (!settings.config.experimental.env) {
		return;
	}

	const schema = settings.config.experimental.env.schema ?? {};

	let client = '';
	let server = '';

	for (const [key, options] of Object.entries(schema)) {
		const str = `export const ${key}: ${getEnvFieldType(options)};	\n`;
		if (options.context === 'client') {
			client += str;
		} else {
			server += str;
		}
	}

	const template = fs.readFileSync(TYPES_TEMPLATE_URL, 'utf-8');
	const content = template.replace('// @@CLIENT@@', client).replace('// @@SERVER@@', server);

	settings.injectedTypes.push({
		filename: 'astro/env.d.ts',
		content,
	});
}
