import { transform } from '@astrojs/compiler';
import ancestor from 'common-ancestor-path';
import esbuild from 'esbuild';
import fs from 'fs';
import type { Plugin } from 'vite';
import type { AstroConfig } from '../@types/astro';

interface AstroPluginOptions {
	config: AstroConfig;
}

// TODO: Clean up some of the shared logic between this Markdown plugin and the Astro plugin.
// Both end up connecting a `load()` hook to the Astro compiler, and share some copy-paste
// logic in how that is done.
export default function markdown({ config }: AstroPluginOptions): Plugin {
	function normalizeFilename(filename: string) {
		if (filename.startsWith('/@fs')) {
			filename = filename.slice('/@fs'.length);
		} else if (filename.startsWith('/') && !ancestor(filename, config.projectRoot.pathname)) {
			filename = new URL('.' + filename, config.projectRoot).pathname;
		}
		return filename;
	}

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

				const filename = normalizeFilename(id);
				const fileUrl = new URL(`file://${filename}`);
				const isPage = filename.startsWith(config.pages.pathname);
				if (isPage && config._ctx.scripts.some((s) => s.stage === 'page')) {
					source += `\n<script hoist src="astro:scripts/page.js" />`;
				}

				// Transform from `.astro` to valid `.ts`
				let { code: tsResult } = await transform(astroResult, {
					pathname: fileUrl.pathname.substr(config.projectRoot.pathname.length - 1),
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
