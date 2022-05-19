import type { AstroConfig } from '../@types/astro';
import { appendForwardSlash } from '../core/path.js';

export function getFileInfo(id: string, config: AstroConfig) {
	const sitePathname = appendForwardSlash(
		config.site ? new URL(config.base, config.site).pathname : config.base
	);

	const fileId = id.split('?')[0];
	let fileUrl = fileId.includes('/pages/')
			? fileId.replace(/^.*?\/pages\//, sitePathname).replace(/(\/index)?\.(md|astro)$/, '')
			: undefined;
	if (fileUrl && config.trailingSlash === 'always') {
		fileUrl = appendForwardSlash(fileUrl);
	}
	return { fileId, fileUrl };
}
