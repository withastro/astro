import { fileURLToPath } from 'node:url';
import { commonAncestorPath } from 'common-ancestor-path';
import {
	appendExtension,
	appendForwardSlash,
	removeLeadingForwardSlashWindows,
} from '../core/path.js';
import { viteID } from '../core/util.js';
function getFileInfo(id, config) {
	const sitePathname = appendForwardSlash(
		config.site ? new URL(config.base, config.site).pathname : config.base,
	);
	const fileId = id.split('?')[0];
	let fileUrl = fileId.includes('/pages/')
		? fileId
				.replace(/^.*?\/pages\//, sitePathname)
				.replace(/(?:\/index)?\.(?:md|markdown|mdown|mkdn|mkd|mdwn|astro)$/, '')
		: void 0;
	if (fileUrl && config.trailingSlash === 'always') {
		fileUrl = appendForwardSlash(fileUrl);
	}
	if (fileUrl && config.build.format === 'file') {
		fileUrl = appendExtension(fileUrl, 'html');
	}
	return { fileId, fileUrl };
}
function normalizeFilename(filename, root) {
	if (filename.startsWith('/@fs')) {
		filename = filename.slice('/@fs'.length);
	} else if (filename.startsWith('.')) {
		const url = new URL(filename, root);
		filename = viteID(url);
	} else if (filename.startsWith('/') && !commonAncestorPath(filename, fileURLToPath(root))) {
		const url = new URL('.' + filename, root);
		filename = viteID(url);
	}
	return removeLeadingForwardSlashWindows(filename);
}
const postfixRE = /[?#].*$/s;
function cleanUrl(url) {
	return url.replace(postfixRE, '');
}
const specialQueriesRE = /(?:\?|&)(?:url|raw|direct)(?:&|$)/;
function hasSpecialQueries(id) {
	return specialQueriesRE.test(id);
}
export { cleanUrl, getFileInfo, hasSpecialQueries, normalizeFilename, specialQueriesRE };
