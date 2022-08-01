import type { Options as AcornOpts } from 'acorn';
import { parse } from 'acorn';
import type { AstroConfig, SSRError } from 'astro';
import type { MdxjsEsm } from 'mdast-util-mdx';

import matter from 'gray-matter';

function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : path + '/';
}

interface FileInfo {
	fileId: string;
	fileUrl: string;
}

/** @see 'vite-plugin-utils' for source */
export function getFileInfo(id: string, config: AstroConfig): FileInfo {
	const sitePathname = appendForwardSlash(
		config.site ? new URL(config.base, config.site).pathname : config.base
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
		fileUrl = fileId.replace(/^.*?\/pages\//, sitePathname).replace(/(\/index)?\.mdx$/, '');
	} else if (url && url.pathname.startsWith(config.root.pathname)) {
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
export function getFrontmatter(code: string, id: string) {
	try {
		return matter(code).data;
	} catch (e: any) {
		if (e.name === 'YAMLException') {
			const err: SSRError = e;
			err.id = id;
			err.loc = { file: e.id, line: e.mark.line + 1, column: e.mark.column };
			err.message = e.reason;
			throw err;
		} else {
			throw e;
		}
	}
}

export function jsToTreeNode(
	jsString: string,
	acornOpts: AcornOpts = {
		ecmaVersion: 'latest',
		sourceType: 'module',
	}
): MdxjsEsm {
	return {
		type: 'mdxjsEsm',
		value: '',
		data: {
			estree: {
				body: [],
				...parse(jsString, acornOpts),
				type: 'Program',
				sourceType: 'module',
			},
		},
	};
}
