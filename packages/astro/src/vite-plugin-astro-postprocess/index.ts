import { parse as babelParser } from '@babel/parser';
import type {
	ArrowFunctionExpressionKind,
	CallExpressionKind,
	StringLiteralKind,
} from 'ast-types/gen/kinds';
import type { NodePath } from 'ast-types/lib/node-path';
import npath from 'path';
import { parse, print, types, visit } from 'recast';
import type { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro';
import { removeLeadingForwardSlashWindows } from '../core/path.js';
import { resolveJsToTs } from '../core/util.js';

// Check for `Astro.glob()`. Be very forgiving of whitespace. False positives are okay.
const ASTRO_GLOB_REGEX = /Astro2?\s*\.\s*glob\s*\(/;
const CLIENT_COMPONENT_PATH_REGEX = /['"]client:component-path['"]:/;

interface AstroPluginOptions {
	settings: AstroSettings;
}

// esbuild transforms the component-scoped Astro into Astro2, so need to check both.
const validAstroGlobalNames = new Set(['Astro', 'Astro2']);

export default function astro(_opts: AstroPluginOptions): Plugin {
	return {
		name: 'astro:postprocess',
		async transform(code, id) {
			// Currently only supported in ".astro" & ".md" files
			if (!id.endsWith('.astro') && !id.endsWith('.md')) {
				return null;
			}

			// Optimization: Detect usage with a quick string match.
			// Only perform the transform if this function is found
			if (!ASTRO_GLOB_REGEX.test(code) && !CLIENT_COMPONENT_PATH_REGEX.test(code)) {
				return null;
			}

			const ast = parse(code, {
				// We need to use the babel parser because `import.meta.hot` is not
				// supported by esprima (default parser). In the future, we should
				// experiment with other parsers if Babel is too slow or heavy.
				parser: { parse: babelParser },
			});

			visit(ast, {
				visitCallExpression: function (path) {
					// Filter out anything that isn't `Astro.glob()` or `Astro2.glob()`
					if (
						!types.namedTypes.MemberExpression.check(path.node.callee) ||
						!types.namedTypes.Identifier.check(path.node.callee.property) ||
						!(path.node.callee.property.name === 'glob') ||
						!types.namedTypes.Identifier.check(path.node.callee.object) ||
						!(path.node.callee.object.name === 'Astro' || path.node.callee.object.name === 'Astro2')
					) {
						this.traverse(path);
						return;
					}

					// Wrap the `Astro.glob()` argument with `import.meta.glob`.
					const argsPath = path.get('arguments', 0) as NodePath;
					const args = argsPath.value;
					argsPath.replace(
						{
							type: 'CallExpression',
							callee: {
								type: 'MemberExpression',
								object: {
									type: 'MetaProperty',
									meta: { type: 'Identifier', name: 'import' },
									property: { type: 'Identifier', name: 'meta' },
								},
								property: { type: 'Identifier', name: 'glob' },
								computed: false,
							},
							arguments: [args],
						} as CallExpressionKind,
						{
							type: 'ArrowFunctionExpression',
							body: args,
							params: [],
						} as ArrowFunctionExpressionKind
					);
					return false;
				},
				visitObjectProperty: function (path) {
					// Filter out none 'client:component-path' properties
					if (
						!types.namedTypes.StringLiteral.check(path.node.key) ||
						path.node.key.value !== 'client:component-path' ||
						!types.namedTypes.StringLiteral.check(path.node.value)
					) {
						this.traverse(path);
						return;
					}

					// Patch up client:component-path value that has leading slash on Windows.
					// See `compile.ts` for more details, this will be fixed in the Astro compiler.
					const valuePath = path.get('value') as NodePath;
					let value = valuePath.value.value;
					value = removeLeadingForwardSlashWindows(value);
					// Add back `.jsx` stripped by the compiler by loosely checking the code
					if (code.includes(npath.basename(value) + '.jsx')) {
						value += '.jsx';
					}
					value = resolveJsToTs(value);
					valuePath.replace({
						type: 'StringLiteral',
						value,
					} as StringLiteralKind);
					return false;
				},
			});

			const result = print(ast);
			return { code: result.code, map: result.map };
		},
	};
}
