import fs from 'node:fs/promises';
import { setVfileFrontmatter } from '@astrojs/markdown-remark';
import type { AstroConfig, SSRError } from 'astro';
import { VFile } from 'vfile';
import type { Plugin } from 'vite';
import type { MdxOptions } from './index.js';
import { createMdxProcessor } from './plugins.js';
import { getFileInfo, parseFrontmatter } from './utils.js';

export function vitePluginMdx(astroConfig: AstroConfig, mdxOptions: MdxOptions): Plugin {
	let processor: ReturnType<typeof createMdxProcessor> | undefined;

	return {
		name: '@mdx-js/rollup',
		enforce: 'pre',
		buildEnd() {
			processor = undefined;
		},
		configResolved(resolved) {
			processor = createMdxProcessor(mdxOptions, {
				sourcemap: !!resolved.build.sourcemap,
			});

			// HACK: move ourselves before Astro's JSX plugin to transform things in the right order
			const jsxPluginIndex = resolved.plugins.findIndex((p) => p.name === 'astro:jsx');
			if (jsxPluginIndex !== -1) {
				const myPluginIndex = resolved.plugins.findIndex((p) => p.name === '@mdx-js/rollup');
				if (myPluginIndex !== -1) {
					const myPlugin = resolved.plugins[myPluginIndex];
					// @ts-ignore-error ignore readonly annotation
					resolved.plugins.splice(myPluginIndex, 1);
					// @ts-ignore-error ignore readonly annotation
					resolved.plugins.splice(jsxPluginIndex, 0, myPlugin);
				}
			}
		},
		async resolveId(source, importer, options) {
			if (importer?.endsWith('.mdx') && source[0] !== '/') {
				let resolved = await this.resolve(source, importer, options);
				if (!resolved) resolved = await this.resolve('./' + source, importer, options);
				return resolved;
			}
		},
		// Override transform to alter code before MDX compilation
		// ex. inject layouts
		async transform(_, id) {
			if (!id.endsWith('.mdx')) return;

			// Read code from file manually to prevent Vite from parsing `import.meta.env` expressions
			const { fileId } = getFileInfo(id, astroConfig);
			const code = await fs.readFile(fileId, 'utf-8');

			const { data: frontmatter, content: pageContent } = parseFrontmatter(code, id);

			const vfile = new VFile({ value: pageContent, path: id });
			// Ensure `data.astro` is available to all remark plugins
			setVfileFrontmatter(vfile, frontmatter);

			// `processor` is initialized in `configResolved`, and removed in `buildEnd`. `transform`
			// should be called in between those two lifecycle, so this error should never happen
			if (!processor) {
				return this.error(
					'MDX processor is not initialized. This is an internal error. Please file an issue.'
				);
			}

			try {
				const compiled = await processor.process(vfile);

				return {
					code: String(compiled.value),
					map: compiled.map,
				};
			} catch (e: any) {
				const err: SSRError = e;

				// For some reason MDX puts the error location in the error's name, not very useful for us.
				err.name = 'MDXError';
				err.loc = { file: fileId, line: e.line, column: e.column };

				// For another some reason, MDX doesn't include a stack trace. Weird
				Error.captureStackTrace(err);

				throw err;
			}
		},
	};
}
