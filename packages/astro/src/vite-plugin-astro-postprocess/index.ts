import { parse } from 'acorn';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import type { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro';
import { isMarkdownFile } from '../core/util.js';

// Check for `Astro.glob()`. Be very forgiving of whitespace. False positives are okay.
const ASTRO_GLOB_REGEX = /Astro2?\s*\.\s*glob\s*\(/;

interface AstroPluginOptions {
	settings: AstroSettings;
}

export default function astro(_opts: AstroPluginOptions): Plugin {
	return {
		name: 'astro:postprocess',
		async transform(code, id) {
			// Currently only supported in ".astro" and ".md" (or any alternative markdown file extension like `.markdown`) files
			if (!id.endsWith('.astro') && !isMarkdownFile(id)) {
				return null;
			}

			// Optimization: Detect usage with a quick string match.
			// Only perform the transform if this function is found
			if (!ASTRO_GLOB_REGEX.test(code)) {
				return null;
			}

			let s: MagicString | undefined;
			const ast = parse(code, {
				ecmaVersion: 'latest',
				sourceType: 'module',
			});
			walk(ast, {
				enter(node: any) {
					// Transform `Astro.glob("./pages/*.astro")` to `Astro.glob(import.meta.glob("./pages/*.astro"), () => "./pages/*.astro")`
					// Also handle for `Astro2.glob()`
					if (
						node.type === 'CallExpression' &&
						node.callee.type === 'MemberExpression' &&
						node.callee.property.name === 'glob' &&
						(node.callee.object.name === 'Astro' || node.callee.object.name === 'Astro2') &&
						node.arguments.length
					) {
						let rawArgs: string = node.arguments[0].raw;
						// If argument is template literal, try convert to a normal string.
						// This is needed for compat with previous recast strategy.
						// TODO: Remove in Astro 2.0
						if (rawArgs.startsWith('`') && rawArgs.endsWith('`') && !rawArgs.includes('${')) {
							rawArgs = JSON.stringify(rawArgs.slice(1, -1));
						}
						s ??= new MagicString(code);
						s.overwrite(
							node.arguments[0].start,
							node.arguments[node.arguments.length - 1].end,
							`import.meta.glob(${rawArgs}), () => ${rawArgs}`
						);
					}
				},
			});

			if (s) {
				return {
					code: s.toString(),
					map: s.generateMap(),
				};
			}
		},
	};
}
