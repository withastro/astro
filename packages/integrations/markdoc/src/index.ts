import type {
	Config as ReadonlyMarkdocConfig,
	ConfigType as MarkdocConfig,
	Node,
} from '@markdoc/markdoc';
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
import type { Plugin as VitePlugin } from 'vite';

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
				const {
					updateConfig,
					config: astroConfig,
					addContentEntryType,
				} = params as SetupHookParams;

				updateConfig({
					vite: {
						plugins: [safeAssetsVirtualModulePlugin({ astroConfig })],
					},
				});

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
					async getRenderModule({ entry }) {
						validateRenderProperties(userMarkdocConfig, astroConfig);
						const ast = Markdoc.parse(entry.body);
						const pluginContext = this;
						const markdocConfig: MarkdocConfig = {
							...userMarkdocConfig,
							variables: {
								...userMarkdocConfig.variables,
								entry,
							},
						};

						if (astroConfig.experimental?.assets) {
							await emitOptimizedImages(ast.children, {
								astroConfig,
								pluginContext,
								filePath: entry._internal.filePath,
							});

							markdocConfig.nodes ??= {};
							markdocConfig.nodes.image = {
								...Markdoc.nodes.image,
								transform(node, config) {
									const attributes = node.transformAttributes(config);
									const children = node.transformChildren(config);

									if (node.type === 'image' && '__optimizedSrc' in node.attributes) {
										const { __optimizedSrc, ...rest } = node.attributes;
										return new Markdoc.Tag('Image', { ...rest, src: __optimizedSrc }, children);
									} else {
										return new Markdoc.Tag('img', attributes, children);
									}
								},
							};
						}

						const content = Markdoc.transform(ast, markdocConfig);

						return {
							code: `import { jsx as h } from 'astro/jsx-runtime';\nimport { Renderer } from '@astrojs/markdoc/components';\nconst transformedContent = ${JSON.stringify(
								content
							)};\nexport async function Content ({ components }) { return h(Renderer, { content: transformedContent, components }); }\nContent[Symbol.for('astro.needsHeadRendering')] = true;`,
						};
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

function validateRenderProperties(markdocConfig: ReadonlyMarkdocConfig, astroConfig: AstroConfig) {
	const tags = markdocConfig.tags ?? {};
	const nodes = markdocConfig.nodes ?? {};

	for (const [name, config] of Object.entries(tags)) {
		validateRenderProperty({ type: 'tag', name, config, astroConfig });
	}
	for (const [name, config] of Object.entries(nodes)) {
		validateRenderProperty({ type: 'node', name, config, astroConfig });
	}
}

function validateRenderProperty({
	name,
	config,
	type,
	astroConfig,
}: {
	name: string;
	config: { render?: string };
	type: 'node' | 'tag';
	astroConfig: Pick<AstroConfig, 'root'>;
}) {
	if (typeof config.render === 'string' && config.render.length === 0) {
		throw new Error(
			`Invalid ${type} configuration: ${JSON.stringify(
				name
			)}. The "render" property cannot be an empty string.`
		);
	}
	if (typeof config.render === 'string' && !isCapitalized(config.render)) {
		const astroConfigPath = getAstroConfigPath(fs, fileURLToPath(astroConfig.root));
		throw new MarkdocError({
			message: `Invalid ${type} configuration: ${JSON.stringify(
				name
			)}. The "render" property must reference a capitalized component name.`,
			hint: 'If you want to render to an HTML element, see our docs on rendering Markdoc manually: https://docs.astro.build/en/guides/integrations-guide/markdoc/#render-markdoc-nodes--html-elements-as-astro-components',
			location: astroConfigPath
				? {
						file: astroConfigPath,
				  }
				: undefined,
		});
	}
}

function isCapitalized(str: string) {
	return str.length > 0 && str[0] === str[0].toUpperCase();
}

/**
 * TODO: remove when `experimental.assets` is baselined.
 *
 * `astro:assets` will fail to resolve if the `experimental.assets` flag is not enabled.
 * This ensures a fallback for the Markdoc renderer to safely import at the top level.
 * @see ../components/TreeNode.ts
 */
function safeAssetsVirtualModulePlugin({
	astroConfig,
}: {
	astroConfig: Pick<AstroConfig, 'experimental'>;
}): VitePlugin {
	const virtualModuleId = 'astro:markdoc-assets';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;

	return {
		name: 'astro:markdoc-safe-assets-virtual-module',
		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id !== resolvedVirtualModuleId) return;

			if (astroConfig.experimental?.assets) {
				return `export { Image } from 'astro:assets';`;
			} else {
				return `export const Image = () => { throw new Error('Cannot use the Image component without the \`experimental.assets\` flag.'); }`;
			}
		},
	};
}
