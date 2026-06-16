import type { AstroConfigLike } from '../types.js';

function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : path + '/';
}

function appendExtension(path: string, extension: string) {
	return path + '.' + extension;
}

export function getFileInfo(id: string, config: AstroConfigLike) {
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
	if (fileUrl && config.build?.format === 'file') {
		fileUrl = appendExtension(fileUrl, 'html');
	}
	return { fileId, fileUrl };
}
