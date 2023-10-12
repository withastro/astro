import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { codeToHtml } from 'shikiji';
import type { ErrorPayload } from 'vite';
import type { ModuleLoader } from '../../module-loader/index.js';
import { FailedToLoadModuleSSR, InvalidGlob, MdxIntegrationMissingError } from '../errors-data.js';
import { AstroError, type ErrorWithMetadata } from '../errors.js';
import { createSafeError } from '../utils.js';
import type { SSRLoadedRenderer } from './../../../@types/astro.js';
import { getDocsForError, renderErrorMarkdown } from './utils.js';
import { replaceCssVariables } from '../../shiki.js';

export function enhanceViteSSRError({
	error,
	filePath,
	loader,
	renderers,
}: {
	error: unknown;
	filePath?: URL;
	loader?: ModuleLoader;
	renderers?: SSRLoadedRenderer[];
}): Error {
	// NOTE: We don't know where the error that's coming here comes from, so we need to be defensive regarding what we do
	// to it to make sure we keep as much information as possible. It's very possible that we receive an error that does not
	// follow any kind of standard formats (ex: a number, a string etc)
	let safeError = createSafeError(error) as ErrorWithMetadata;

	// Vite will give you better stacktraces, using sourcemaps.
	if (loader) {
		try {
			loader.fixStacktrace(safeError as Error);
		} catch {}
	}

	if (filePath) {
		const path = fileURLToPath(filePath);
		const content = fs.readFileSync(path).toString();
		const lns = content.split('\n');

		// Vite has a fairly generic error message when it fails to load a module, let's try to enhance it a bit
		// https://github.com/vitejs/vite/blob/ee7c28a46a6563d54b828af42570c55f16b15d2c/packages/vite/src/node/ssr/ssrModuleLoader.ts#L91
		let importName: string | undefined;
		if ((importName = safeError.message.match(/Failed to load url (.*?) \(resolved id:/)?.[1])) {
			safeError.title = FailedToLoadModuleSSR.title;
			safeError.name = 'FailedToLoadModuleSSR';
			safeError.message = FailedToLoadModuleSSR.message(importName);
			safeError.hint = FailedToLoadModuleSSR.hint;
			const line = lns.findIndex((ln) => ln.includes(importName!));

			if (line !== -1) {
				const column = lns[line]?.indexOf(importName);

				safeError.loc = {
					file: path,
					line: line + 1,
					column,
				};
			}
		}

		const fileId = safeError.id ?? safeError.loc?.file;

		// Vite throws a syntax error trying to parse MDX without a plugin.
		// Suggest installing the MDX integration if none is found.
		if (
			!renderers?.find((r) => r.name === '@astrojs/mdx') &&
			safeError.message.match(/Syntax error/) &&
			fileId?.match(/\.mdx$/)
		) {
			safeError = new AstroError({
				...MdxIntegrationMissingError,
				message: MdxIntegrationMissingError.message(JSON.stringify(fileId)),
				location: safeError.loc,
				stack: safeError.stack,
			}) as ErrorWithMetadata;
		}

		// Since Astro.glob is a wrapper around Vite's import.meta.glob, errors don't show accurate information, let's fix that
		if (/Invalid glob/.test(safeError.message)) {
			const globPattern = safeError.message.match(/glob: "(.+)" \(/)?.[1];

			if (globPattern) {
				safeError.message = InvalidGlob.message(globPattern);
				safeError.name = 'InvalidGlob';
				safeError.hint = InvalidGlob.hint;
				safeError.title = InvalidGlob.title;

				const line = lns.findIndex((ln) => ln.includes(globPattern));

				if (line !== -1) {
					const column = lns[line]?.indexOf(globPattern);

					safeError.loc = {
						file: path,
						line: line + 1,
						column,
					};
				}
			}
		}
	}

	return safeError;
}

export interface AstroErrorPayload {
	type: ErrorPayload['type'];
	err: Omit<ErrorPayload['err'], 'loc'> & {
		name?: string;
		title?: string;
		hint?: string;
		docslink?: string;
		highlightedCode?: string;
		loc: {
			file?: string;
			line?: number;
			column?: number;
		};
		cause?: unknown;
	};
}

// Shiki does not support `mjs` or `cjs` aliases by default.
// Map these to `.js` during error highlighting.
const ALTERNATIVE_JS_EXTS = ['cjs', 'mjs'];
const ALTERNATIVE_MD_EXTS = ['mdoc'];
const INLINE_STYLE_SELECTOR_GLOBAL = /style="(.*?)"/g;

/**
 * Generate a payload for Vite's error overlay
 */
export async function getViteErrorPayload(err: ErrorWithMetadata): Promise<AstroErrorPayload> {
	let plugin = err.plugin;
	if (!plugin && err.hint) {
		plugin = 'astro';
	}

	const message = renderErrorMarkdown(err.message.trim(), 'html');
	const hint = err.hint ? renderErrorMarkdown(err.hint.trim(), 'html') : undefined;

	const docslink = getDocsForError(err);

	let highlighterLang = err.loc?.file?.split('.').pop();
	if (ALTERNATIVE_JS_EXTS.includes(highlighterLang ?? '')) {
		highlighterLang = 'js';
	}
	if (ALTERNATIVE_MD_EXTS.includes(highlighterLang ?? '')) {
		highlighterLang = 'md';
	}
	let highlightedCode = err.fullCode
		? await codeToHtml(err.fullCode, {
				// @ts-expect-error always assume that shiki can accept the lang string
				lang: highlighterLang,
				theme: 'css-variables',
				lineOptions: err.loc?.line ? [{ line: err.loc.line, classes: ['error-line'] }] : undefined,
		  })
		: undefined;

	if (highlightedCode) {
		highlightedCode = highlightedCode.replace(INLINE_STYLE_SELECTOR_GLOBAL, (m) =>
			replaceCssVariables(m)
		);
	}

	return {
		type: 'error',
		err: {
			...err,
			name: err.name,
			type: err.type,
			message,
			hint,
			frame: err.frame,
			highlightedCode,
			docslink,
			loc: {
				file: err.loc?.file,
				line: err.loc?.line,
				column: err.loc?.column,
			},
			plugin,
			stack: err.stack,
			cause: err.cause,
		},
	};
}
