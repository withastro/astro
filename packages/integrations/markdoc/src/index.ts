import type { AstroIntegration } from 'astro';
import type { InlineConfig } from 'vite';
import _Markdoc from '@markdoc/markdoc';
import fs from 'node:fs';
import { parseFrontmatter } from './utils.js';
import { fileURLToPath } from 'node:url';

const contentEntryType = {
	extensions: ['.mdoc'],
	async getEntryInfo({ fileUrl }: { fileUrl: URL }) {
		const rawContents = await fs.promises.readFile(fileUrl, 'utf-8');
		const parsed = parseFrontmatter(rawContents, fileURLToPath(fileUrl));
		return {
			data: parsed.data,
			body: parsed.content,
			slug: parsed.data.slug,
			rawData: parsed.matter,
		};
	},
	async render({ entry }: { entry: any }) {
		function getParsed() {
			return Markdoc.parse(entry.body);
		}
		async function getTransformed(inlineConfig: any) {
			let config = inlineConfig;
			// TODO: load config file
			// if (!config) {
			// 	try {
			// 		const importedConfig = await import('./markdoc.config.ts');
			// 		config = importedConfig.default.transform;
			// 	} catch {}
			// }
			return Markdoc.transform(getParsed(), config);
		}
		return { getParsed, getTransformed };
	},
};

export default function markdoc(partialOptions: {} = {}): AstroIntegration {
	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, addContentEntryType, command }: any) => {
				addContentEntryType(contentEntryType);
				console.log('Markdoc working!');
				const markdocConfigUrl = new URL('./markdoc.config.ts', config.srcDir);

				const viteConfig: InlineConfig = {
					plugins: [
						{
							name: '@astrojs/markdoc',
							async transform(code, id) {
								if (!id.endsWith('.mdoc')) return;
								return `import { Markdoc } from '@astrojs/markdoc';\nexport const body = ${JSON.stringify(
									code
								)};\nexport function getParsed() { return Markdoc.parse(body); }\nexport async function getTransformed(inlineConfig) {
let config = inlineConfig;
if (!config) {
	try {
		const importedConfig = await import(${JSON.stringify(markdocConfigUrl.pathname)});
		config = importedConfig.default.transform;
	} catch {}
}
return Markdoc.transform(getParsed(), config) }`;
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
