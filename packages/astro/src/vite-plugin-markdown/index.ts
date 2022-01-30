import type { Plugin } from '../core/vite';
import type { AstroConfig } from '../@types/astro';

import esbuild from 'esbuild';
import fs from 'fs';
import { transform } from '@astrojs/compiler';
import resolve from 'resolve';

interface AstroPluginOptions {
	config: AstroConfig;
}

let count = 0;
const buildCache: Record<string, () => Promise<string>> = {};

/** Transform .astro files for Vite */
export default function markdown({ config }: AstroPluginOptions): Plugin {
	return {
		name: 'astro:markdown',
		enforce: 'pre', // run transforms before other plugins can
		async resolveId(id) {
			if (buildCache[id]) {
				return id;
			}
		},
		async load(id) {
			if (buildCache[id]) {
				console.log('LOAD', id);
				return {code: await buildCache[id]()};
			}
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

				const cacheId = `MD_BUILD_${count++}`;
				console.log('CREATE', cacheId, id);
				buildCache[cacheId] = (async () => {
					
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
					internalURL: 'astro/internal',
				});

				tsResult = `\nexport const metadata = ${JSON.stringify(metadata)};
export const frontmatter = ${JSON.stringify(content)};
${tsResult}`;

				// Compile from `.ts` to `.js`
				const { code, map } = await esbuild.transform(tsResult, { loader: 'ts', sourcemap: 'inline', sourcefile: id });
				return code;
				})

				return {
					code: `
						export const frontmatter = ${JSON.stringify(frontmatter)};
						export default async function render(...args) {
							return (await import(${JSON.stringify(cacheId)})).default(...args);
						};
						render.isAstroComponentFactory = true;`,
						
					map: null,
				};

				// return {
				// 	code,
				// 	map: null,
				// };
			}

			return null;
		},
	};
}
