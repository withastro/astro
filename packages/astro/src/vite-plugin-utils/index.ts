import ancestor from 'common-ancestor-path';
import type { Data } from 'vfile';
import type { AstroConfig, MarkdownAstroData } from '../@types/astro';
import {
	appendExtension,
	appendForwardSlash,
	removeLeadingForwardSlashWindows,
} from '../core/path.js';

/**
 * Converts the first dot in `import.meta.env` to its Unicode escape sequence,
 * which prevents Vite from replacing strings like `import.meta.env.SITE`
 * in our JS representation of modules like Markdown
 */
export function escapeViteEnvReferences(code: string) {
	return code.replace(/import\.meta\.env/g, 'import\\u002Emeta.env');
}

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

export class InvalidAstroDataError extends TypeError {}

export function safelyGetAstroData(vfileData: Data): MarkdownAstroData | InvalidAstroDataError {
	const { astro } = vfileData;

	if (!astro || !isValidAstroData(astro)) {
		return new InvalidAstroDataError();
	}

	return astro;
}

/**
 * Normalizes different file names like:
 *
 * - /@fs/home/user/project/src/pages/index.astro
 * - /src/pages/index.astro
 *
 * as absolute file paths with forward slashes.
 */
export function normalizeFilename(filename: string, config: AstroConfig) {
	if (filename.startsWith('/@fs')) {
		filename = filename.slice('/@fs'.length);
	} else if (filename.startsWith('/') && !ancestor(filename, config.root.pathname)) {
		filename = new URL('.' + filename, config.root).pathname;
	}
	return removeLeadingForwardSlashWindows(filename);
}
