import matter from 'gray-matter';
import path from 'node:path';
import type fsMod from 'node:fs';
import type { ErrorPayload as ViteErrorPayload } from 'vite';

/**
 * Match YAML exception handling from Astro core errors
 * @see 'astro/src/core/errors.ts'
 */
export function parseFrontmatter(fileContents: string, filePath: string) {
	try {
		// `matter` is empty string on cache results
		// clear cache to prevent this
		(matter as any).clearCache();
		return matter(fileContents);
	} catch (e: any) {
		if (e.name === 'YAMLException') {
			const err: Error & ViteErrorPayload['err'] = e;
			err.id = filePath;
			err.loc = { file: e.id, line: e.mark.line + 1, column: e.mark.column };
			err.message = e.reason;
			throw err;
		} else {
			throw e;
		}
	}
}

/**
 * Matches AstroError object with types like error codes stubbed out
 * @see 'astro/src/core/errors/errors.ts'
 */
export class MarkdocError extends Error {
	public errorCode: number;
	public loc: ErrorLocation | undefined;
	public title: string | undefined;
	public hint: string | undefined;
	public frame: string | undefined;

	type = 'MarkdocError';

	constructor(props: ErrorProperties, ...params: any) {
		super(...params);

		const {
			code = 99999,
			name,
			title = 'MarkdocError',
			message,
			stack,
			location,
			hint,
			frame,
		} = props;

		this.errorCode = code;
		this.title = title;
		if (message) this.message = message;
		// Only set this if we actually have a stack passed, otherwise uses Error's
		this.stack = stack ? stack : this.stack;
		this.loc = location;
		this.hint = hint;
		this.frame = frame;
	}
}

interface ErrorLocation {
	file?: string;
	line?: number;
	column?: number;
}

interface ErrorProperties {
	code?: number;
	title?: string;
	name?: string;
	message?: string;
	location?: ErrorLocation;
	hint?: string;
	stack?: string;
	frame?: string;
}

/**
 * Matches `search` function used for resolving `astro.config` files.
 * Used by Markdoc for error handling.
 * @see 'astro/src/core/config/config.ts'
 */
export function getAstroConfigPath(fs: typeof fsMod, root: string): string | undefined {
	const paths = [
		'astro.config.mjs',
		'astro.config.js',
		'astro.config.ts',
		'astro.config.mts',
		'astro.config.cjs',
		'astro.config.cts',
	].map((p) => path.join(root, p));

	for (const file of paths) {
		if (fs.existsSync(file)) {
			return file;
		}
	}
}
