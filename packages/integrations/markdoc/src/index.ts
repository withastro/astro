import type {
	Config as ReadonlyMarkdocConfig,
	ConfigType as MarkdocConfig,
} from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import type { AstroConfig, AstroIntegration, ContentEntryType, HookParameters } from 'astro';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	getAstroConfigPath,
	isValidUrl,
	MarkdocError,
	parseFrontmatter,
	prependForwardSlash,
} from './utils.js';
import { emitESMImage } from 'astro/dist/assets/index.js';
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

				const assetsDir = new URL('./assets/', astroConfig.srcDir);
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
							markdocConfig.nodes ??= {};
							markdocConfig.nodes.image = {
								...Markdoc.nodes.image,
								async transform(node, config) {
									const attributes = node.transformAttributes(config);
									const children = node.transformChildren(config);
									const { src, ...rest } = attributes;

									// Short circuit for external or absolute paths.
									if (src.startsWith('/') || isValidUrl(src)) {
										return new Markdoc.Tag('img', attributes, children);
									}

									// Attempt to resolve source against `src/assets/` with Vite.
									// This handles relative paths and configured aliases
									const resolved = await pluginContext.resolve(
										src,
										// Use arbitrary file name for Vite to resolve against in `src/assets/`
										new URL('entry.js', assetsDir).pathname
									);

									if (
										resolved?.id &&
										fs.existsSync(new URL(prependForwardSlash(resolved.id), 'file://'))
									) {
										const image = await emitESMImage(
											resolved.id,
											pluginContext.meta.watchMode,
											pluginContext.emitFile,
											{ config: astroConfig }
										);

										return new Markdoc.Tag('Image', { ...rest, src: image }, children);
									} else {
										throw new MarkdocError({
											message: `Could not resolve image ${JSON.stringify(
												src
											)} from \`src/assets/\`. Does the file exist?`,
										});
									}
								},
							};
						}

						const content = await Markdoc.transform(ast, markdocConfig);

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
