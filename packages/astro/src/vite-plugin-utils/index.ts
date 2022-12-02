import ancestor from 'common-ancestor-path';
import path from 'path';
import { fileURLToPath } from 'url';
import { Data } from 'vfile';
import type { AstroConfig, MarkdownAstroData } from '../@types/astro';
import {
	appendExtension,
	appendForwardSlash,
	removeLeadingForwardSlashWindows,
} from '../core/path.js';

export function getFileInfo(id: string, config: AstroConfig) {
	const sitePathname = appendForwardSlash(
		config.site ? new URL(config.base, config.site).pathname : config.base
	);

	const fileId = id.split('?')[0];
	let fileUrl = fileId.includes('/pages/')
		? fileId
				.replace(/^.*?\/pages\//, sitePathname)
				.replace(/(\/index)?\.(md|markdown|mdown|mkdn|mkd|mdwn|md|astro)$/, '')
		: undefined;
	if (fileUrl && config.trailingSlash === 'always') {
		fileUrl = appendForwardSlash(fileUrl);
	}
	if (fileUrl && config.build.format === 'file') {
		fileUrl = appendExtension(fileUrl, 'html');
	}
	return { fileId, fileUrl };
}

function isValidAstroData(obj: unknown): obj is MarkdownAstroData {
	if (typeof obj === 'object' && obj !== null && obj.hasOwnProperty('frontmatter')) {
		const { frontmatter } = obj as any;
		try {
			// ensure frontmatter is JSON-serializable
			JSON.stringify(frontmatter);
		} catch {
			return false;
		}
		return typeof frontmatter === 'object' && frontmatter !== null;
	}
	return false;
}

export function safelyGetAstroData(vfileData: Data): MarkdownAstroData {
	const { astro } = vfileData;

	if (!astro) return { frontmatter: {} };
	if (!isValidAstroData(astro)) {
		throw Error(
			`[Markdown] A remark or rehype plugin tried to add invalid frontmatter. Ensure "astro.frontmatter" is a JSON object!`
		);
	}

	return astro;
}

/**
 * Normalizes different file names like:
 *
 * - /@fs/home/user/project/src/pages/index.astro
 * - /src/pages/index.astro
 *
 * as absolute file paths.
 */
export function normalizeFilename(filename: string, config: AstroConfig) {
	if (filename.startsWith('/@fs')) {
		filename = removeLeadingForwardSlashWindows(filename.slice('/@fs'.length));
	} else if (filename.startsWith('/') && !ancestor(filename, config.root.pathname)) {
		filename = path.join(fileURLToPath(config.root), filename);
	}
	return filename;
}
