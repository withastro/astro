import { parseFrontmatter } from '@astrojs/internal-helpers/frontmatter';
import { isYAMLParseError } from '@astrojs/internal-helpers/yaml-error';
import type { AstroConfig, SSRError } from 'astro';

export function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : path + '/';
}

export interface FileInfo {
	fileId: string;
	fileUrl: string;
}

/** @see 'vite-plugin-utils' for source */
export function getFileInfo(id: string, config: AstroConfig): FileInfo {
	const sitePathname = appendForwardSlash(
		config.site ? new URL(config.base, config.site).pathname : config.base,
	);

	// Try to grab the file's actual URL
	let url: URL | undefined = undefined;
	try {
		url = new URL(`file://${id}`);
	} catch {}

	const fileId = id.split('?')[0];
	let fileUrl: string;
	const isPage = fileId.includes('/pages/');
	if (isPage) {
		fileUrl = fileId.replace(/^.*?\/pages\//, sitePathname).replace(/(?:\/index)?\.mdx$/, '');
	} else if (url?.pathname.startsWith(config.root.pathname)) {
		fileUrl = url.pathname.slice(config.root.pathname.length);
	} else {
		fileUrl = fileId;
	}

	if (fileUrl && config.trailingSlash === 'always') {
		fileUrl = appendForwardSlash(fileUrl);
	}
	return { fileId, fileUrl };
}

/**
 * Match YAML exception handling from Astro core errors
 * @see 'astro/src/core/errors.ts'
 */
export function safeParseFrontmatter(code: string, id: string) {
	try {
		return parseFrontmatter(code, { frontmatter: 'empty-with-spaces' });
	} catch (e: any) {
		if (isYAMLParseError(e)) {
			const err = e as SSRError;
			err.stack ??= '';
			err.id = id;
			const position = e.linePos?.[0];
			if (position) {
				err.loc = { file: id, line: position.line, column: position.col - 1 };
			}
			err.message = e.message;
			throw err;
		} else {
			throw e;
		}
	}
}
