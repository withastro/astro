import { parse } from 'acorn';
import type { Node as ESTreeNode } from 'estree-walker';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import type { Plugin } from 'vite';
import { isMarkdownFile } from '../core/util.js';
import { resolveConfig } from '../core/config/config.js';
import { z } from "zod";

// Check for `Astro.glob()`. Be very forgiving of whitespace. False positives are okay.
const ASTRO_GLOB_REGEX = /Astro2?\s*\.\s*glob\s*\(/;

export default async function astro(): Plugin {
	const { userConfig, _ } = resolveConfig(inlineConfig, 'build');
	return {
		name: 'astro:postprocess',
		async transform(code, id) {
			// Currently only supported in ".astro", ".json" and ".md" (or any alternative markdown file extension like `.markdown`) files
			if (!id.endsWith('.astro') && !isMarkdownFile(id) && !id.endsWith('.json')) {
				return null;
			}

			// Optimization: Detect usage with a quick string match.
			// Only perform the transform if this function is found
			if (!ASTRO_GLOB_REGEX.test(code)) {
				return null;
			}
			
			// Early return to process JSON code
			if (id.endsWith('.json')) {
				// Do the following for .json files according to the specefied schema in the astro config:
				// - Type-check
				// - Transform image URLs into objects for use with the astro image component as the src property
				(await userConfig).jsonDataFiles.map(fileProps => {
					if (fileProps.path == id) {
                        return {
							code: z.parse().toString()
						};
					}
				})
				return null
			}

			let s: MagicString | undefined;
			const ast = parse(code, {
				ecmaVersion: 'latest',
				sourceType: 'module',
			});

			walk(ast as ESTreeNode, {
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
						const firstArgStart = node.arguments[0].start;
						const firstArgEnd = node.arguments[0].end;
						const lastArgEnd = node.arguments[node.arguments.length - 1].end;
						const firstArg = code.slice(firstArgStart, firstArgEnd);
						s ??= new MagicString(code);
						s.overwrite(
							firstArgStart,
							lastArgEnd,
							`import.meta.glob(${firstArg}), () => ${firstArg}`
						);
					}
				},
			});

			if (s) {
				return {
					code: s.toString(),
					map: s.generateMap({ hires: 'boundary' }),
				};
			}
		},
	};
}
