import type { Plugin } from 'vite';
import type { AstroConfig } from '../@types/astro';

import esbuild from 'esbuild';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { transform } from '@astrojs/compiler';

interface AstroPluginOptions {
	config: AstroConfig;
}

/** Transform .astro files for Vite */
export default function markdown({ config }: AstroPluginOptions): Plugin {
	return {
		name: 'astro:markdown',
		enforce: 'pre', // run transforms before other plugins can
		async load(id) {
			if (id.endsWith('.md')) {
				let source = await fs.promises.readFile(id, 'utf8');

				// Transform from `.md` to valid `.astro`
				let render = config.markdownOptions.render;
				let renderOpts = {};
				if (Array.isArray(render)) {
					renderOpts = render[1];
					render = render[0];
				}
				if (typeof render === 'string') {
					({ default: render } = await import(render));
				}
				let renderResult = await render(source, renderOpts);
				let { frontmatter, metadata, code: astroResult } = renderResult;

				// Extract special frontmatter keys
				const { layout = '', components = '', setup = '', ...content } = frontmatter;
				content.astro = metadata;
				const prelude = `---
${layout ? `import Layout from '${layout}';` : ''}
${components ? `import * from '${components}';` : ''}
${setup}
const $$content = ${JSON.stringify(content)}
---`;
				const imports = `${layout ? `import Layout from '${layout}';` : ''}
${setup}`.trim();
				// If the user imported "Layout", wrap the content in a Layout
				if (/\bLayout\b/.test(imports)) {
					astroResult = `${prelude}\n<Layout content={$$content}>\n\n${astroResult}\n\n</Layout>`;
				} else {
					astroResult = `${prelude}\n${astroResult}`;
				}

				const filenameURL = new URL(`file://${id}`);
				const pathname = filenameURL.pathname.substr(config.projectRoot.pathname.length - 1);

				// Transform from `.astro` to valid `.ts`
				let { code: tsResult } = await transform(astroResult, {
					pathname,
					projectRoot: config.projectRoot.toString(),
					site: config.buildOptions.site,
					sourcefile: id,
					sourcemap: 'inline',
					internalURL: `/@fs${new URL('../runtime/server/index.js', import.meta.url).pathname}`,
				});

				tsResult = `\nexport const metadata = ${JSON.stringify(metadata)};
export const frontmatter = ${JSON.stringify(content)};
${tsResult}`;

				// Compile from `.ts` to `.js`
				const { code, map } = await esbuild.transform(tsResult, { loader: 'ts', sourcemap: 'inline', sourcefile: id });

				return {
					code,
					map: null,
				};
			}

			return null;
		},
	};
}
