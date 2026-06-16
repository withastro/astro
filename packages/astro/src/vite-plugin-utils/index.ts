import { appendExtension, appendForwardSlash } from '../core/path.js';
import type { AstroConfig } from '../types/public/config.js';

export {
	cleanUrl,
	hasSpecialQueries,
	normalizeFilename,
	specialQueriesRE,
} from '@astrojs/internal-helpers/vite';

export function getFileInfo(id: string, config: AstroConfig) {
	const sitePathname = appendForwardSlash(
		config.site ? new URL(config.base, config.site).pathname : config.base,
	);

	const fileId = id.split('?')[0];
	let fileUrl = fileId.includes('/pages/')
		? fileId
				.replace(/^.*?\/pages\//, sitePathname)
				.replace(/(?:\/index)?\.(?:md|markdown|mdown|mkdn|mkd|mdwn|astro)$/, '')
		: undefined;
	if (fileUrl && config.trailingSlash === 'always') {
		fileUrl = appendForwardSlash(fileUrl);
	}
	if (fileUrl && config.build.format === 'file') {
		fileUrl = appendExtension(fileUrl, 'html');
	}
	return { fileId, fileUrl };
}
