import type { AstroConfig } from 'astro';

function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : path + '/';
}

/** @see 'vite-plugin-utils' for source */
export function getFileInfo(id: string, config: AstroConfig) {
	const sitePathname = appendForwardSlash(
		config.site ? new URL(config.base, config.site).pathname : config.base
	);

	const fileId = id.split('?')[0];
	let fileUrl = fileId.includes('/pages/')
		? fileId.replace(/^.*?\/pages\//, sitePathname).replace(/(\/index)?\.mdx$/, '')
		: undefined;
	if (fileUrl && config.trailingSlash === 'always') {
		fileUrl = appendForwardSlash(fileUrl);
	}
	return { fileId, fileUrl };
}
