import type { AstroSettings } from '../@types/astro.js';
import { CONTENT_TYPES_FILE } from './consts.js';
import type fsMod from 'node:fs';

export function injectContentTypes({
	settings,
	fs,
}: { settings: AstroSettings; fs: typeof fsMod }) {
	settings.injectedTypes.push({
		filename: CONTENT_TYPES_FILE,
		condition: () => fs.existsSync(new URL(CONTENT_TYPES_FILE, settings.dotAstroDir)),
	});

	return settings;
}
