import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { codeToHtml, createCssVariablesTheme } from 'shiki';
import { AstroError } from '../errors.js';
import { FailedToLoadModuleSSR, MdxIntegrationMissingError } from '../errors-data.js';
import { createSafeError } from '../utils.js';
import { getDocsForError, renderErrorMarkdown } from './runtime.js';
function enhanceViteSSRError({ error, filePath, loader, renderers }) {
	let safeError = createSafeError(error);
	if (loader) {
		try {
			loader.fixStacktrace(safeError);
		} catch {}
	}
	if (filePath) {
		const path = fileURLToPath(filePath);
		const content = fs.readFileSync(path).toString();
		const lns = content.split('\n');
		let importName;
		if ((importName = /Failed to load url (.*?) \(resolved id:/.exec(safeError.message)?.[1])) {
			safeError.title = FailedToLoadModuleSSR.title;
			safeError.name = 'FailedToLoadModuleSSR';
			safeError.message = FailedToLoadModuleSSR.message(importName);
			safeError.hint = FailedToLoadModuleSSR.hint;
			const line = lns.findIndex((ln) => ln.includes(importName));
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
		if (
			fileId &&
			!renderers?.find((r) => r.name === '@astrojs/mdx') &&
			safeError.message.includes('Syntax error') &&
			/.mdx$/.test(fileId)
		) {
			safeError = new AstroError({
				...MdxIntegrationMissingError,
				message: MdxIntegrationMissingError.message(JSON.stringify(fileId)),
				location: safeError.loc,
				stack: safeError.stack,
			});
		}
	}
	return safeError;
}
const ALTERNATIVE_JS_EXTS = ['cjs', 'mjs'];
const ALTERNATIVE_MD_EXTS = ['mdoc'];
let _cssVariablesTheme;
const cssVariablesTheme = () =>
	_cssVariablesTheme ??
	(_cssVariablesTheme = createCssVariablesTheme({ variablePrefix: '--astro-code-' }));
async function getViteErrorPayload(err) {
	let plugin = err.plugin;
	if (!plugin && err.hint) {
		plugin = 'astro';
	}
	const message = renderErrorMarkdown(err.message.trim(), 'html');
	const hint = err.hint ? renderErrorMarkdown(err.hint.trim(), 'html') : void 0;
	const docslink = getDocsForError(err);
	let highlighterLang = err.loc?.file?.split('.').pop();
	if (ALTERNATIVE_JS_EXTS.includes(highlighterLang ?? '')) {
		highlighterLang = 'js';
	} else if (ALTERNATIVE_MD_EXTS.includes(highlighterLang ?? '')) {
		highlighterLang = 'md';
	}
	const highlightedCode = err.fullCode
		? await codeToHtml(err.fullCode, {
				lang: highlighterLang ?? 'text',
				theme: cssVariablesTheme(),
				transformers: [
					transformerCompactLineOptions(
						err.loc?.line ? [{ line: err.loc.line, classes: ['error-line'] }] : void 0,
					),
				],
			})
		: void 0;
	return {
		__isEnhancedAstroErrorPayload: true,
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
function transformerCompactLineOptions(lineOptions = []) {
	return {
		name: '@shikijs/transformers:compact-line-options',
		line(node, line) {
			const lineOption = lineOptions.find((o) => o.line === line);
			if (lineOption?.classes) this.addClassToHast(node, lineOption.classes);
			return node;
		},
	};
}
export { enhanceViteSSRError, getViteErrorPayload };
