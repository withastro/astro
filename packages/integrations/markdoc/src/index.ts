import type { AstroIntegration } from 'astro';
import type { InlineConfig } from 'vite';
import _Markdoc from '@markdoc/markdoc';
import { parseFrontmatter } from './utils.js';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

export default function markdoc(): AstroIntegration {
	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, addContentEntryType, command }: any) => {
				const contentEntryType = {
					extensions: ['.mdoc'],
					async getEntryInfo({ fileUrl, contents }: { fileUrl: URL; contents: string }) {
						const parsed = parseFrontmatter(contents, fileURLToPath(fileUrl));
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
								return `import { jsx as h } from 'astro/jsx-runtime';\nimport { Markdoc } from '@astrojs/markdoc';\nimport { Renderer } from '@astrojs/markdoc/components';\nexport const body = ${JSON.stringify(
									code
								)};\nexport function getParsed() { return Markdoc.parse(body); }\nexport function getTransformed(inlineConfig) { return Markdoc.transform(getParsed(), inlineConfig) }\nexport async function Content ({ config, components }) { return h(Renderer, { content: getTransformed(config), components }); }\nContent[Symbol.for('astro.needsHeadRendering')] = true;`;
							},
						},
					],
				};
				updateConfig({ vite: viteConfig });
			},
		},
	};
}

export const Markdoc = _Markdoc;
