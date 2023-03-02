import type { AstroIntegration, AstroConfig } from 'astro';
import type { InlineConfig } from 'vite';
import type { Config } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import { getAstroConfigPath, MarkdocError, parseFrontmatter } from './utils.js';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

export default function markdoc(markdocConfig: Config = {}): AstroIntegration {
	const entryBodyByFileIdCache = new Map<string, string>();
	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, addContentEntryType }: any) => {
				const contentEntryType = {
					extensions: ['.mdoc'],
					getEntryInfo({ fileUrl, contents }: { fileUrl: URL; contents: string }) {
						const parsed = parseFrontmatter(contents, fileURLToPath(fileUrl));
						entryBodyByFileIdCache.set(fileUrl.pathname, parsed.content);
						return {
							data: parsed.data,
							body: parsed.content,
							slug: parsed.data.slug,
							rawData: parsed.matter,
						};
					},
					contentModuleTypes: await fs.promises.readFile(
						new URL('../template/content-module-types.d.ts', import.meta.url),
						'utf-8'
					),
				};
				addContentEntryType(contentEntryType);

				const viteConfig: InlineConfig = {
					plugins: [
						{
							name: '@astrojs/markdoc',
							async transform(code, id) {
								if (!id.endsWith('.mdoc')) return;

								validateRenderProperties(markdocConfig, config);
								const body = entryBodyByFileIdCache.get(id);
								if (!body) {
									// Cache entry should exist if `getCollection()` was called
									// (see `getEntryInfo()` above)
									// If not, the user probably tried to import directly.
									throw new Error(
										`Unable to render ${JSON.stringify(
											id.replace(config.root.pathname, '')
										)}. If you tried to import this file directly, please use a Content Collection query instead. See https://docs.astro.build/en/guides/content-collections/#rendering-content-to-html for more information.`
									);
								}
								const ast = Markdoc.parse(body);
								const content = Markdoc.transform(ast, markdocConfig);

								return `import { jsx as h } from 'astro/jsx-runtime';\nimport { Renderer } from '@astrojs/markdoc/components';\nconst transformedContent = ${JSON.stringify(
									content
								)};\nexport async function Content ({ components }) { return h(Renderer, { content: transformedContent, components }); }\nContent[Symbol.for('astro.needsHeadRendering')] = true;`;
							},
						},
					],
				};
				updateConfig({ vite: viteConfig });
			},
		},
	};
}

function validateRenderProperties(markdocConfig: Config, astroConfig: AstroConfig) {
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
			)}. The "render" property must reference a capitalized component name. If you want to render to an HTML element, see our docs on rendering Markdoc manually [TODO docs link].`,
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
