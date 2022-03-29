import { parse as babelParser } from '@babel/parser';
import type { ArrowFunctionExpressionKind, CallExpressionKind, StringLiteralKind } from 'ast-types/gen/kinds';
import type { NodePath } from 'ast-types/lib/node-path';
import { parse, print, types, visit } from "recast";
import type { Plugin } from 'vite';
import type { AstroConfig } from '../@types/astro';

// Check for `Astro.glob()`. Be very forgiving of whitespace. False positives are okay.
const ASTRO_GLOB_REGEX = /Astro2?\s*\.\s*glob\s*\(/;
interface AstroPluginOptions {
	config: AstroConfig;
}

// esbuild transforms the component-scoped Astro into Astro2, so need to check both.
const validAstroGlobalNames = new Set(['Astro', 'Astro2']);

export default function astro({ config }: AstroPluginOptions): Plugin {
	return {
		name: 'astro:postprocess',
		async transform(code, id) {
			// Currently only supported in ".astro" & ".md" files
			if (!id.endsWith('.astro') && !id.endsWith('.md')) {
				return null;
			}

			// Optimization: Detect usage with a quick string match.
			// Only perform the transform if this function is found
			if (!ASTRO_GLOB_REGEX.test(code)) {
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
					argsPath.replace({
						type: 'CallExpression',
						callee: {
							type: 'MemberExpression',
							object: { type: 'MetaProperty', meta: { type: 'Identifier', name: 'import' }, property: { type: 'Identifier', name: 'meta' } },
							property: { type: 'Identifier', name: 'glob' },
							computed: false,
						},
						arguments: [args],
					} as CallExpressionKind,
						{
							type: 'ArrowFunctionExpression',
							body: args,
							params: []
						} as ArrowFunctionExpressionKind);
					return false;
				},
			});

			const result = print(ast);
			return { code: result.code, map: result.map };
		},
	};
}
