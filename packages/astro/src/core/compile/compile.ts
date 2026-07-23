import { fileURLToPath } from 'node:url';
import { parse, preprocessStyles, transform, type TransformResult } from '@astrojs/compiler-rs';
import type { ResolvedConfig } from 'vite';
import type { AstroConfig } from '../../types/public/config.js';
import type { AstroError } from '../errors/errors.js';
import { AggregateError, CompilerError } from '../errors/errors.js';
import { AstroErrorData } from '../errors/index.js';
import { normalizePath, resolvePath } from '../viteUtils.js';
import { createStylePreprocessor, type PartialCompileCssResult } from './style.js';
import type { CompileCssResult } from './types.js';

export interface CompileProps {
	astroConfig: AstroConfig;
	viteConfig: ResolvedConfig;
	toolbarEnabled: boolean;
	filename: string;
	source: string;
}

export interface CompileResult extends Omit<TransformResult, 'css'> {
	css: CompileCssResult[];
}

export async function compile({
	astroConfig,
	viteConfig,
	toolbarEnabled,
	filename,
	source,
}: CompileProps): Promise<CompileResult> {
	const cssPartialCompileResults: PartialCompileCssResult[] = [];
	const cssTransformErrors: AstroError[] = [];
	let transformResult: TransformResult;

	try {
		const preprocessedStyles = await preprocessStyles(
			source,
			createStylePreprocessor({
				filename,
				viteConfig,
				astroConfig,
				cssPartialCompileResults,
				cssTransformErrors,
			}),
		);

		// When using JSX whitespace rules, protect text content with newlines
		// inside component children from being collapsed. The compiler's JSX
		// algorithm strips newlines from all text nodes, but component slot
		// content may be rendered inside <pre> or other whitespace-sensitive
		// contexts that aren't visible at the call site.
		// See https://github.com/withastro/astro/issues/17490
		const transformSource =
			astroConfig.compressHTML === 'jsx' ? preserveComponentSlotNewlines(source) : source;

		transformResult = transform(transformSource, {
			compact: astroConfig.compressHTML,
			filename,
			normalizedFilename: normalizeFilename(filename, astroConfig.root),
			sourcemap: 'both',
			internalURL: 'astro/compiler-runtime',
			// TODO: remove in Astro v7
			astroGlobalArgs: JSON.stringify(astroConfig.site),
			scopedStyleStrategy: astroConfig.scopedStyleStrategy,
			resultScopedSlot: true,
			transitionsAnimationURL: 'astro/components/viewtransitions.css',
			annotateSourceFile:
				viteConfig.command === 'serve' &&
				astroConfig.devToolbar &&
				astroConfig.devToolbar.enabled &&
				toolbarEnabled,
			preprocessedStyles,
			resolvePath(specifier) {
				return resolvePath(specifier, filename);
			},
		});
	} catch (err: any) {
		// The compiler should be able to handle errors by itself, however
		// for the rare cases where it can't let's directly throw here with as much info as possible
		throw new CompilerError({
			...AstroErrorData.UnknownCompilerError,
			message: err.message ?? 'Unknown compiler error',
			stack: err.stack,
			location: {
				file: filename,
			},
		});
	}

	handleCompileResultErrors(filename, transformResult, cssTransformErrors);

	return {
		...transformResult,
		css: transformResult.css.map((code, i) => ({
			...cssPartialCompileResults[i],
			code,
		})),
	};
}

function handleCompileResultErrors(
	filename: string,
	result: TransformResult,
	cssTransformErrors: AstroError[],
) {
	const compilerError = result.diagnostics.find((diag) => diag.severity === 'error');

	if (compilerError) {
		throw new CompilerError({
			name: 'CompilerError',
			message: compilerError.text,
			location: {
				line: compilerError.labels[0].line,
				column: compilerError.labels[0].column,
				file: filename,
			},
			hint: compilerError.hint,
		});
	}

	switch (cssTransformErrors.length) {
		case 0:
			break;
		case 1: {
			throw cssTransformErrors[0];
		}
		default: {
			throw new AggregateError({
				...cssTransformErrors[0],
				errors: cssTransformErrors,
			});
		}
	}
}

/**
 * Wraps text nodes inside component children in template literal expressions
 * so the compiler's JSX whitespace algorithm does not collapse their newlines.
 *
 * The JSX whitespace algorithm strips all newlines from text content and joins
 * lines with a single space. This is correct for regular HTML elements (where
 * whitespace is insignificant) but wrong for component slot content that may be
 * rendered inside `<pre>` or other whitespace-sensitive contexts.
 *
 * By wrapping `text` → `{\`text\`}`, the text becomes a JS expression that the
 * compiler passes through without whitespace manipulation.
 */
function preserveComponentSlotNewlines(source: string): string {
	let ast: Record<string, any>;
	try {
		({ ast } = parse(source));
	} catch {
		// If parsing fails, return the source unchanged and let the
		// transform step report the error with full diagnostics.
		return source;
	}

	interface TextNode {
		start: number;
		end: number;
		raw: string;
	}
	const textNodes: TextNode[] = [];

	function visit(nodes: any[] | undefined): void {
		if (!nodes) return;
		for (const node of nodes) {
			if (node.type === 'JSXElement') {
				const name: string = node.openingElement?.name?.name ?? '';
				// Components start with an uppercase letter or contain a dot (e.g. Foo.Bar)
				const isComponent =
					(name.length > 0 && name[0] >= 'A' && name[0] <= 'Z') || name.includes('.');
				if (isComponent && node.children) {
					for (const child of node.children) {
						if (
							child.type === 'JSXText' &&
							child.raw.includes('\n') &&
							child.raw.trim().length > 0
						) {
							textNodes.push({ start: child.start, end: child.end, raw: child.raw });
						}
					}
				}
			}
			// Recurse into children and expression bodies
			visit(node.children);
			if (node.expression?.type === 'JSXElement') {
				visit([node.expression]);
			}
		}
	}
	visit(ast.body);

	if (textNodes.length === 0) return source;

	// Apply replacements from end to start to preserve earlier positions
	let result = source;
	for (let i = textNodes.length - 1; i >= 0; i--) {
		const { start, end, raw } = textNodes[i];
		// Escape characters that are special inside template literals
		const escaped = raw.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
		result = result.slice(0, start) + '{`' + escaped + '`}' + result.slice(end);
	}
	return result;
}

function normalizeFilename(filename: string, root: URL) {
	const normalizedFilename = normalizePath(filename);
	const normalizedRoot = normalizePath(fileURLToPath(root));
	if (normalizedFilename.startsWith(normalizedRoot)) {
		return normalizedFilename.slice(normalizedRoot.length - 1);
	} else {
		return normalizedFilename;
	}
}
