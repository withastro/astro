import type { AstroIntegration, AstroConfig, ContentEntryType, HookParameters } from 'astro';
import { InlineConfig } from 'vite';
import type { Config } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import {
	prependForwardSlash,
	getAstroConfigPath,
	MarkdocError,
	parseFrontmatter,
} from './utils.js';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

type IntegrationWithPrivateHooks = {
	name: string;
	hooks: Omit<AstroIntegration['hooks'], 'astro:config:setup'> & {
		'astro:config:setup': (
			params: HookParameters<'astro:config:setup'> & {
				// `contentEntryType` is not a public API
				// Add type defs here
				addContentEntryType: (contentEntryType: ContentEntryType) => void;
			}
		) => void | Promise<void>;
	};
};

export default function markdoc(markdocConfig: Config = {}): IntegrationWithPrivateHooks {
	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, addContentEntryType }) => {
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
					contentModuleTypes: await fs.promises.readFile(
						new URL('../template/content-module-types.d.ts', import.meta.url),
						'utf-8'
					),
				});

				const viteConfig: InlineConfig = {
					plugins: [
						{
							name: '@astrojs/markdoc',
							async transform(code, id) {
								if (!id.endsWith('.mdoc')) return;

								validateRenderProperties(markdocConfig, config);
								const body = getEntryInfo({
									// Can't use `pathToFileUrl` - Vite IDs are not plain file paths
									fileUrl: new URL(prependForwardSlash(id), 'file://'),
									contents: code,
								}).body;
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
