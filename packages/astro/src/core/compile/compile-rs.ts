import { fileURLToPath } from 'node:url';
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

export interface CompileResult {
	code: string;
	map: string;
	scope: string;
	css: CompileCssResult[];
	scripts: any[];
	hydratedComponents: any[];
	clientOnlyComponents: any[];
	serverComponents: any[];
	containsHead: boolean;
	propagation: boolean;
	styleError: string[];
	diagnostics: any[];
}

export async function compile({
	astroConfig,
	viteConfig,
	toolbarEnabled,
	filename,
	source,
}: CompileProps): Promise<CompileResult> {
	let preprocessStyles;
	let transform;
	try {
		({ preprocessStyles, transform } = await import('@astrojs/compiler-rs'));
	} catch (err: unknown) {
		throw new Error(
			`Failed to load @astrojs/compiler-rs. Make sure it is installed and up to date. Original error: ${err}`,
		);
	}

	const cssPartialCompileResults: PartialCompileCssResult[] = [];
	const cssTransformErrors: AstroError[] = [];
	let transformResult: any;

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

		transformResult = transform(source, {
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

	// Workaround: The Rust compiler doesn't handle dynamic slot attributes inside
	// conditional expressions correctly (e.g. `{cond ? <C slot={expr} /> : null}`).
	// It places the content in the "default" slot instead of using a computed property key.
	// Post-process the output to fix this. See https://github.com/withastro/astro/issues/15948
	transformResult.code = fixDynamicSlotExpressions(transformResult.code);

	return {
		...transformResult,
		css: transformResult.css.map((code: string, i: number) => ({
			...cssPartialCompileResults[i],
			code,
		})),
	};
}

function handleCompileResultErrors(
	filename: string,
	result: any,
	cssTransformErrors: AstroError[],
) {
	const compilerError = result.diagnostics.find((diag: any) => diag.severity === 'error');

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
 * Fixes the Rust compiler's incorrect handling of dynamic slot attributes inside
 * conditional expressions.
 *
 * The Rust compiler incorrectly places `{cond ? <Component slot={expr} /> : null}`
 * inside the "default" slot function body, with `slot` as a regular prop. The Go
 * compiler correctly extracts this into a computed-key slot entry like
 * `[expr]: ($$result) => $$render\`...\``.
 *
 * This function scans the compiled output for `$$renderComponent` calls inside
 * "default" slot functions that have a "slot" prop with an expression value,
 * and restructures the slots object to match the Go compiler's output.
 */
function fixDynamicSlotExpressions(code: string): string {
	// Quick bailout: if there's no "slot" prop with an expression value, nothing to fix
	if (!code.includes('"slot":') && !code.includes("'slot':")) {
		return code;
	}

	// We need to find patterns where a $$renderComponent call with a dynamic "slot" prop
	// is embedded inside a conditional expression within the "default" slot function body.
	//
	// The buggy pattern looks like:
	//   "default": ($$result) => $$render`${COND ? $$render`${$$renderComponent($$result, ..., { ..., "slot": EXPR })}` : null}...`
	//
	// We need to transform this to:
	//   "default": ($$result) => $$render`...`,
	//   [EXPR]: ($$result) => $$render`${COND ? $$render`${$$renderComponent($$result, ..., { ..., "slot": EXPR })}` : null}`

	// Find all occurrences of $$renderComponent inside default slots that have
	// a "slot" prop with a non-string-literal value
	let result = code;
	let changed = true;

	// Iterate because there could be multiple such patterns in a single file
	while (changed) {
		changed = false;
		const fixResult = fixOneOccurrence(result);
		if (fixResult !== null) {
			result = fixResult;
			changed = true;
		}
	}

	return result;
}

function fixOneOccurrence(code: string): string | null {
	// Find "default" slot entries in slots objects that contain a $$renderComponent
	// with a dynamic "slot" prop inside a conditional expression.
	//
	// Strategy:
	// 1. Find `"default": ($$result) => $$render\`` pattern
	// 2. Within its template literal body, find a conditional expression wrapping a $$renderComponent
	// 3. Check if that $$renderComponent has a "slot" prop with a non-literal expression
	// 4. Extract it and create a computed key slot entry

	// Look for the pattern: conditional ? $$render`${$$renderComponent(... "slot": EXPR ...)}` : null
	// within a "default" slot function

	// Step 1: Find "default" slot function starts
	const defaultSlotRe = /"default":\s*\(\$\$result\)\s*=>\s*\$\$render`/g;
	let match;

	while ((match = defaultSlotRe.exec(code)) !== null) {
		const templateLiteralStart = match.index + match[0].length;

		// Step 2: Find the end of this template literal (matching backtick)
		const templateEnd = findTemplateEnd(code, templateLiteralStart);
		if (templateEnd === -1) continue;

		const templateBody = code.slice(templateLiteralStart, templateEnd);

		// Step 3: Find a conditional expression within this template body that wraps a
		// $$renderComponent with a dynamic "slot" prop
		const extraction = extractDynamicSlotFromDefault(templateBody);
		if (!extraction) continue;

		// Step 4: Build the replacement
		// Remove the extracted conditional from the default slot body
		const newDefaultBody =
			templateBody.slice(0, extraction.startInBody) + templateBody.slice(extraction.endInBody);

		// Build the new slot entry
		const slotExpr = extraction.slotExpression;
		const conditionalCode = extraction.fullConditional;

		// Find where the default slot entry ends in the slots object (right after the template literal)
		// We need to insert the new computed slot entry after the default slot
		const afterDefaultTemplate = templateEnd + 1; // +1 for the closing backtick

		// Build new code:
		// 1. Replace the default slot's template body
		// 2. Add a new computed-key slot entry
		const newCode =
			code.slice(0, templateLiteralStart) +
			newDefaultBody +
			code.slice(templateEnd, afterDefaultTemplate) +
			`,\n\t\t[${slotExpr}]: ($$result) => $$render\`${conditionalCode}\`` +
			code.slice(afterDefaultTemplate);

		return newCode;
	}

	return null;
}

/**
 * Find the end of a template literal starting at position `start` (which is right after the opening backtick).
 * Returns the index of the closing backtick, or -1 if not found.
 * Handles nested template literals inside ${} expressions.
 */
function findTemplateEnd(code: string, start: number): number {
	let i = start;
	while (i < code.length) {
		const ch = code[i];
		if (ch === '\\') {
			i += 2; // skip escaped character
			continue;
		}
		if (ch === '`') {
			return i; // found the end
		}
		if (ch === '$' && i + 1 < code.length && code[i + 1] === '{') {
			// Start of expression within template literal
			i += 2;
			i = skipExpression(code, i);
			continue;
		}
		i++;
	}
	return -1;
}

/**
 * Skip a JavaScript expression starting at position `start` (right after `${`).
 * Returns the position right after the closing `}`.
 * Handles nested braces, template literals, strings, etc.
 */
function skipExpression(code: string, start: number): number {
	let depth = 1;
	let i = start;
	while (i < code.length && depth > 0) {
		const ch = code[i];
		if (ch === '{') {
			depth++;
			i++;
		} else if (ch === '}') {
			depth--;
			if (depth === 0) return i + 1;
			i++;
		} else if (ch === '`') {
			// Nested template literal
			i++;
			i = skipTemplateLiteral(code, i);
		} else if (ch === '"' || ch === "'") {
			i = skipString(code, i);
		} else if (ch === '/' && i + 1 < code.length && code[i + 1] === '/') {
			// Line comment
			while (i < code.length && code[i] !== '\n') i++;
		} else if (ch === '/' && i + 1 < code.length && code[i + 1] === '*') {
			// Block comment
			i += 2;
			while (i + 1 < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++;
			i += 2;
		} else {
			i++;
		}
	}
	return i;
}

/**
 * Skip a template literal body starting at position `start` (right after the opening backtick).
 * Returns the position right after the closing backtick.
 */
function skipTemplateLiteral(code: string, start: number): number {
	let i = start;
	while (i < code.length) {
		const ch = code[i];
		if (ch === '\\') {
			i += 2;
			continue;
		}
		if (ch === '`') {
			return i + 1;
		}
		if (ch === '$' && i + 1 < code.length && code[i + 1] === '{') {
			i += 2;
			i = skipExpression(code, i);
			continue;
		}
		i++;
	}
	return i;
}

/**
 * Skip a string starting at position `start` (at the opening quote).
 * Returns the position right after the closing quote.
 */
function skipString(code: string, start: number): number {
	const quote = code[start];
	let i = start + 1;
	while (i < code.length) {
		if (code[i] === '\\') {
			i += 2;
			continue;
		}
		if (code[i] === quote) {
			return i + 1;
		}
		i++;
	}
	return i;
}

interface DynamicSlotExtraction {
	/** Start position of the conditional expression within the template body */
	startInBody: number;
	/** End position of the conditional expression within the template body */
	endInBody: number;
	/** The full conditional expression code (e.g. `${cond ? $$render\`...\` : null}`) */
	fullConditional: string;
	/** The slot expression (e.g. `meta ? "meta" : ""`) */
	slotExpression: string;
}

/**
 * Within a default slot template body, find a conditional expression that wraps a
 * $$renderComponent with a dynamic "slot" prop.
 *
 * Returns the extraction info or null if not found.
 */
function extractDynamicSlotFromDefault(templateBody: string): DynamicSlotExtraction | null {
	// Look for ${...} expressions in the template body
	let i = 0;
	while (i < templateBody.length) {
		if (templateBody[i] === '$' && i + 1 < templateBody.length && templateBody[i + 1] === '{') {
			const exprStart = i;
			const innerStart = i + 2;
			// Find the matching closing brace
			const innerEnd = findMatchingBrace(templateBody, innerStart);
			if (innerEnd === -1) {
				i += 2;
				continue;
			}
			const exprEnd = innerEnd + 1; // include the closing }
			const innerCode = templateBody.slice(innerStart, innerEnd).trim();

			// Check if this is a conditional expression: COND ? $$render`${$$renderComponent(...)}` : null
			const dynamicSlot = extractSlotFromConditional(innerCode);
			if (dynamicSlot) {
				return {
					startInBody: exprStart,
					endInBody: exprEnd,
					fullConditional: templateBody.slice(exprStart, exprEnd),
					slotExpression: dynamicSlot,
				};
			}

			i = exprEnd;
			continue;
		}
		i++;
	}
	return null;
}

/**
 * Find the matching closing brace for an expression starting at `start` (right after `${`).
 * Returns the index of the closing `}`, or -1 if not found.
 */
function findMatchingBrace(code: string, start: number): number {
	let depth = 1;
	let i = start;
	while (i < code.length && depth > 0) {
		const ch = code[i];
		if (ch === '{') {
			depth++;
			i++;
		} else if (ch === '}') {
			depth--;
			if (depth === 0) return i;
			i++;
		} else if (ch === '`') {
			i++;
			// Skip template literal content
			while (i < code.length) {
				if (code[i] === '\\') {
					i += 2;
					continue;
				}
				if (code[i] === '`') {
					i++;
					break;
				}
				if (code[i] === '$' && i + 1 < code.length && code[i + 1] === '{') {
					i += 2;
					const end = findMatchingBrace(code, i);
					if (end === -1) return -1;
					i = end + 1;
					continue;
				}
				i++;
			}
		} else if (ch === '"' || ch === "'") {
			i = skipString(code, i);
		} else {
			i++;
		}
	}
	return depth === 0 ? i : -1;
}

/**
 * Check if code is a conditional expression wrapping a $$renderComponent that has
 * a dynamic "slot" prop. If so, return the slot expression.
 *
 * Expected pattern:
 *   COND ? $$render`${$$renderComponent($$result, ..., { ..., "slot": EXPR })}` : null
 */
function extractSlotFromConditional(code: string): string | null {
	// The code should contain $$renderComponent with a "slot" prop
	if (!code.includes('$$renderComponent')) return null;
	if (!code.includes('"slot"')) return null;

	// Find the "slot" prop and extract its value
	// Pattern: "slot": VALUE (where VALUE is not a string literal)
	const slotPropRe = /"slot":\s*/g;
	let slotMatch;
	while ((slotMatch = slotPropRe.exec(code)) !== null) {
		const valueStart = slotMatch.index + slotMatch[0].length;

		// Check if the value is a string literal (starts with " or ')
		const firstChar = code[valueStart];
		if (firstChar === '"' || firstChar === "'") {
			// This is a static slot value - skip it (Rust compiler handles these correctly)
			continue;
		}

		// This is a dynamic slot expression - extract it
		const valueEnd = findExpressionEnd(code, valueStart);
		if (valueEnd === -1) continue;

		const slotExpression = code.slice(valueStart, valueEnd).trim();

		// Verify the slot expression is non-trivial (not just a variable)
		// Actually, any non-string-literal slot expression in a conditional is the buggy pattern
		return slotExpression;
	}

	return null;
}

/**
 * Find the end of a JavaScript expression starting at `start`.
 * The expression ends at an unmatched `,`, `}`, or `)`.
 * Returns the index of the terminating character.
 */
function findExpressionEnd(code: string, start: number): number {
	let depth = 0;
	let i = start;
	while (i < code.length) {
		const ch = code[i];
		if (ch === '(' || ch === '[' || ch === '{') {
			depth++;
			i++;
		} else if (ch === ')' || ch === ']' || ch === '}') {
			if (depth === 0) return i;
			depth--;
			i++;
		} else if (ch === ',') {
			if (depth === 0) return i;
			i++;
		} else if (ch === '"' || ch === "'") {
			i = skipString(code, i);
		} else if (ch === '`') {
			i++;
			i = skipTemplateLiteralContent(code, i);
		} else {
			i++;
		}
	}
	return -1;
}

/**
 * Skip template literal content starting right after the opening backtick.
 * Returns position right after the closing backtick.
 */
function skipTemplateLiteralContent(code: string, start: number): number {
	let i = start;
	while (i < code.length) {
		if (code[i] === '\\') {
			i += 2;
			continue;
		}
		if (code[i] === '`') {
			return i + 1;
		}
		if (code[i] === '$' && i + 1 < code.length && code[i + 1] === '{') {
			i += 2;
			const end = findMatchingBrace(code, i);
			if (end === -1) return i;
			i = end + 1;
			continue;
		}
		i++;
	}
	return i;
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
