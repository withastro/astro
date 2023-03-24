import type { Config as ReadonlyMarkdocConfig, Node } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import type { AstroConfig, AstroIntegration, ContentEntryType, HookParameters } from 'astro';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type * as rollup from 'rollup';
import {
	getAstroConfigPath,
	isValidUrl,
	MarkdocError,
	parseFrontmatter,
	prependForwardSlash,
} from './utils.js';
// @ts-expect-error Cannot find module 'astro/assets' or its corresponding type declarations.
import { emitESMImage } from 'astro/assets';
import { loadMarkdocConfig } from './load-config.js';
import { applyDefaultConfig } from './default-config.js';

type SetupHookParams = HookParameters<'astro:config:setup'> & {
	// `contentEntryType` is not a public API
	// Add type defs here
	addContentEntryType: (contentEntryType: ContentEntryType) => void;
};

export default function markdocIntegration(
	userMarkdocConfig: ReadonlyMarkdocConfig = {}
): AstroIntegration {
	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async (params) => {
				const { config: astroConfig, addContentEntryType } = params as SetupHookParams;

				const configLoadResult = await loadMarkdocConfig(astroConfig);
				const userMarkdocConfig = configLoadResult?.config ?? {};

				function getEntryInfo({ fileUrl, contents }: { fileUrl: URL; contents: string }) {
					const parsed = parseFrontmatter(contents, fileURLToPath(fileUrl));
					return {
						data: parsed.data,
						body: parsed.content,
						slug: parsed.data.slug,
						rawData: parsed.matter,
					};
				}
				addContentEntryType({
					extensions: ['.mdoc'],
					getEntryInfo,
					async getRenderModule({ entry, viteId }) {
						const ast = Markdoc.parse(entry.body);
						const pluginContext = this;
						const markdocConfig = applyDefaultConfig({ entry, config: userMarkdocConfig });

						const validationErrors = Markdoc.validate(ast, markdocConfig).filter((e) => {
							// Ignore `variable-undefined` errors.
							// Variables can be configured at runtime,
							// so we cannot validate them at build time.
							return e.error.id !== 'variable-undefined';
						});
						if (validationErrors.length) {
							throw new MarkdocError({
								message: [
									`**${String(entry.collection)} → ${String(entry.id)}** failed to validate:`,
									...validationErrors.map((e) => e.error.id),
								].join('\n'),
							});
						}

						if (astroConfig.experimental.assets) {
							await emitOptimizedImages(ast.children, {
								astroConfig,
								pluginContext,
								filePath: entry._internal.filePath,
							});
						}

						const code = {
							code: `import { jsx as h } from 'astro/jsx-runtime';import { applyDefaultConfig } from '@astrojs/markdoc/default-config';\nimport * as entry from ${JSON.stringify(
								viteId + '?astroContent'
							)};\n${
								configLoadResult
									? `\nimport userConfig from ${JSON.stringify(configLoadResult.fileUrl.pathname)};`
									: ''
							}${
								astroConfig.experimental.assets
									? `\nimport { experimentalAssetsConfig } from '@astrojs/markdoc/experimental-assets-config';`
									: ''
							}\nimport { Renderer } from '@astrojs/markdoc/components';\nconst stringifiedAst = ${JSON.stringify(
								// Double stringify to encode *as* stringified JSON
								JSON.stringify(ast)
							)};\nexport async function Content (props) {\n	const config = applyDefaultConfig({ entry, config: ${
								configLoadResult
									? '{ ...userConfig, variables: { ...userConfig.variables, ...props } }'
									: '{ variables: props }'
							} });\n${
								astroConfig.experimental.assets
									? `\nconfig.nodes = { ...experimentalAssetsConfig.nodes, ...config.nodes };`
									: ''
							}\n	return h(Renderer, { stringifiedAst, config }); };`,
						};
						return code;
					},
					contentModuleTypes: await fs.promises.readFile(
						new URL('../template/content-module-types.d.ts', import.meta.url),
						'utf-8'
					),
				});
			},
		},
	};
}

/**
 * Emits optimized images, and appends the generated `src` to each AST node
 * via the `__optimizedSrc` attribute.
 */
async function emitOptimizedImages(
	nodeChildren: Node[],
	ctx: {
		pluginContext: rollup.PluginContext;
		filePath: string;
		astroConfig: AstroConfig;
	}
) {
	for (const node of nodeChildren) {
		if (
			node.type === 'image' &&
			typeof node.attributes.src === 'string' &&
			shouldOptimizeImage(node.attributes.src)
		) {
			// Attempt to resolve source with Vite.
			// This handles relative paths and configured aliases
			const resolved = await ctx.pluginContext.resolve(node.attributes.src, ctx.filePath);

			if (resolved?.id && fs.existsSync(new URL(prependForwardSlash(resolved.id), 'file://'))) {
				const src = await emitESMImage(
					resolved.id,
					ctx.pluginContext.meta.watchMode,
					ctx.pluginContext.emitFile,
					{ config: ctx.astroConfig }
				);
				node.attributes.__optimizedSrc = src;
			} else {
				throw new MarkdocError({
					message: `Could not resolve image ${JSON.stringify(
						node.attributes.src
					)} from ${JSON.stringify(ctx.filePath)}. Does the file exist?`,
				});
			}
		}
		await emitOptimizedImages(node.children, ctx);
	}
}

function shouldOptimizeImage(src: string) {
	// Optimize anything that is NOT external or an absolute path to `public/`
	return !isValidUrl(src) && !src.startsWith('/');
}
