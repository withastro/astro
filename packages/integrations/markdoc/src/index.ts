import type {
	Config as ReadonlyMarkdocConfig,
	ConfigType as MarkdocConfig,
} from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import type { AstroConfig, AstroIntegration, ContentEntryType, HookParameters } from 'astro';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
	getAstroConfigPath,
	isAliasedPath,
	MarkdocError,
	parseFrontmatter,
	isRelativePath,
} from './utils.js';
import { emitESMImage } from 'astro/assets/utils/emitAsset';

type SetupHookParams = HookParameters<'astro:config:setup'> & {
	// `contentEntryType` is not a public API
	// Add type defs here
	addContentEntryType: (contentEntryType: ContentEntryType) => void;
};

export default function markdocIntegration(
	markdocConfig: ReadonlyMarkdocConfig = {}
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
						validateRenderProperties(markdocConfig, astroConfig);
						const ast = Markdoc.parse(entry.body);
						const pluginContext = this;

						const config: MarkdocConfig = {
							...markdocConfig,
							variables: {
								...markdocConfig.variables,
								entry,
							},
						};

						if (astroConfig.experimental?.assets) {
							config.nodes ??= {};
							config.nodes.image = {
								...Markdoc.nodes.image,
								async transform(node, config) {
									const { src, ...rest } = node.attributes;
									// TODO: aliased paths
									if (isRelativePath(src)) {
										const srcUrl = new URL(src, assetsDir);
										if (!fs.existsSync(srcUrl)) {
											throw new MarkdocError({
												message: `Could not find the image ${JSON.stringify(
													src
												)} from \`src/assets/\`. Does the file exist?`,
											});
										}

										const image = await emitESMImage(
											new URL(src, assetsDir),
											pluginContext.meta.watchMode,
											pluginContext.emitFile,
											{ config: astroConfig }
										);

										return new Markdoc.Tag('Image', {
											...rest,
											src: image,
										});
									}
									const attributes = node.transformAttributes(config);
									const children = node.transformChildren(config);
									return new Markdoc.Tag('img', attributes, children);
								},
							};
						}

						const content = await Markdoc.transform(ast, config);

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
