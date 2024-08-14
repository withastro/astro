import type { AstroSettings } from '../@types/astro.js';
import { ENV_TYPES_FILE } from './constants.js';
import { getEnvFieldType } from './validators.js';

export function syncAstroEnv(settings: AstroSettings): void {
	let client: string | null = null;
	let server: string | null = null;

	for (const [key, options] of Object.entries(settings.config.env.schema)) {
		const str = `	export const ${key}: ${getEnvFieldType(options)};	\n`;
		if (options.context === 'client') {
			client ??= '';
			client += str;
		} else {
			server ??= '';
			server += str;
		}
	}

	let content: string | null = null;
	if (client !== null) {
		content = `declare module 'astro:env/client' {
${client}}`;
	}
	if (server !== null) {
		content ??= '';
		content += `declare module 'astro:env/server' {
${server}}`;
	}

	if (content) {
		settings.injectedTypes.push({
			filename: ENV_TYPES_FILE,
			content,
		});
	}
}
