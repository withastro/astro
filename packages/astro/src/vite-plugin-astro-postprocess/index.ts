import { parse } from 'acorn';
import type { Node as ESTreeNode } from 'estree-walker';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import type { Plugin } from 'vite';
import { isMarkdownFile } from '../core/util.js';
import type { AstroSettings, jsonDataFile } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';
import type { ZodIssue } from 'zod';
import fs from 'fs';

// Check for `Astro.glob()`. Be very forgiving of whitespace. False positives are okay.
const ASTRO_GLOB_REGEX = /Astro2?\s*\.\s*glob\s*\(/;

export default function astro(settings: AstroSettings, logger: Logger): Plugin {
	return {
		name: 'astro:postprocess',
		async load(id) {
			// Do the following for .json files according to the specefied schema in the astro config:
			// - Type-check
			// - Transform image URLs into objects for use with the astro image component as the src property (TODO)
			// This processing cannot take place in the transform function because that gives us JS code, not JSON code
			if (!id.endsWith('.json')) {
				return null;
			}
			settings.config.jsonDataFiles.map((fileProps: jsonDataFile) => {
				if (fileProps.path.pathname == id) {
					fs.readFile(id, 'utf8', function(err, code) {
						if (err) {
							logger.error('build', `Failed to read file ${id}`);
							return null;
						}
						let parsedJSON = fileProps.schema.safeParse(JSON.parse(code));
						if (!parsedJSON.success) {
							// TODO: stop the build process for build mode/display a big error for debug mode
							logger.error(
								'build',
								`Failed to type-check ${fileProps.path} with ${parsedJSON.error.issues.length} error(s):`
								+ parsedJSON.error.issues.map((issue: ZodIssue) =>
									`\n - At ${issue.path.join(" -> ")}: ${issue.message}`
								).join("")
							);
							return null;
						}
						return `export default ${JSON.stringify(parsedJSON.data)}`;
					});
				}
			});
		},
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
