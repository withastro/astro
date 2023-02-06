import type { AstroIntegration } from 'astro';
import type { InlineConfig } from 'vite';
import _Markdoc from '@markdoc/markdoc';

export default function markdoc(partialOptions: {} = {}): AstroIntegration {
	return {
		name: '@astrojs/markdoc',
		hooks: {
			'astro:config:setup': async ({ updateConfig, config, addPageExtension, command }: any) => {
				addPageExtension('.mdoc');
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
