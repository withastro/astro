import type { PluggableList } from '@mdx-js/mdx/lib/core.js';
import type { Options as AcornOpts } from 'acorn';
import { parse } from 'acorn';
import type { AstroConfig, SSRError } from 'astro';
import matter from 'gray-matter';
import { bold, yellow } from 'kleur/colors';
import type { MdxjsEsm } from 'mdast-util-mdx';

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
export function parseFrontmatter(code: string, id: string) {
	try {
		return matter(code);
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

export function ignoreStringPlugins(plugins: any[]): PluggableList {
	let validPlugins: PluggableList = [];
	let hasInvalidPlugin = false;
	for (const plugin of plugins) {
		if (typeof plugin === 'string') {
			console.warn(yellow(`[MDX] ${bold(plugin)} not applied.`));
			hasInvalidPlugin = true;
		} else if (Array.isArray(plugin) && typeof plugin[0] === 'string') {
			console.warn(yellow(`[MDX] ${bold(plugin[0])} not applied.`));
			hasInvalidPlugin = true;
		} else {
			validPlugins.push(plugin);
		}
	}
	if (hasInvalidPlugin) {
		console.warn(
			`To inherit Markdown plugins in MDX, please use explicit imports in your config instead of "strings." See Markdown docs: https://docs.astro.build/en/guides/markdown-content/#markdown-plugins`
		);
	}
	return validPlugins;
}
