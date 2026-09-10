import type { SSRError } from 'astro';
import type { MarkdownProcessor, MdxRenderer } from 'astro/markdown';
import type { Plugin } from 'vite';
import type { ResolvedMdxOptions } from './index.js';
import { safeParseFrontmatter } from './utils.js';

export interface VitePluginMdxOptions {
	mdxOptions: ResolvedMdxOptions;
	srcDir: URL;
	processor: MarkdownProcessor;
}

// NOTE: Do not destructure `opts` as we're assigning a reference that will be mutated later
export function vitePluginMdx(opts: VitePluginMdxOptions): Plugin {
	let mdxRenderer: MdxRenderer | undefined;
	let sourcemapEnabled: boolean;

	return {
		name: '@mdx-js/rolldown',
		enforce: 'pre',
		buildEnd() {
			mdxRenderer = undefined;
		},
		configResolved(resolved) {
			sourcemapEnabled = !!resolved.build.sourcemap;

			// HACK: Remove the `astro:jsx` plugin if defined as we handle the JSX transformation ourselves
			const jsxPluginIndex = resolved.plugins.findIndex((p) => p.name === 'astro:jsx');
			if (jsxPluginIndex !== -1) {
				// @ts-ignore-error ignore readonly annotation
				resolved.plugins.splice(jsxPluginIndex, 1);
			}
		},
		resolveId: {
			filter: {
				// Do not match sources that start with /
				id: /^[^/]/,
			},
			async handler(source, importer, options) {
				if (importer?.endsWith('.mdx')) {
					let resolved = await this.resolve(source, importer, options);
					if (!resolved) resolved = await this.resolve('./' + source, importer, options);
					return resolved;
				}
			},
		},
		transform: {
			filter: {
				id: /\.mdx$/,
			},
			async handler(code, id) {
				const { frontmatter, content } = safeParseFrontmatter(code, id);

				try {
					if (!mdxRenderer) {
						mdxRenderer = await resolveMdxRenderer(opts, sourcemapEnabled);
					}
					const result = await mdxRenderer.process(content, id, frontmatter);
					return {
						code: result.code,
						map: result.map ?? null,
						meta: {
							astro: result.astroMetadata,
							// `lang: 'ts'` makes Vite resolve `.js` import specifiers to `.ts` files.
							vite: { lang: 'ts' },
						},
					};
				} catch (e: any) {
					const err: SSRError = e;
					// Surface compile failures as a dedicated MDX error with a source
					// location so the dev overlay can point at the offending file.
					err.name = 'MDXError';
					// Some parser errors (e.g. from oxc) embed line:col only in the
					// message as a "line:col: ..." prefix instead of setting properties.
					let line = e.line;
					let column = e.column;
					if (line == null || column == null) {
						const match = /^(\d+):(\d+):/.exec(e.message);
						if (match) {
							line ??= Number(match[1]);
							column ??= Number(match[2]);
						}
					}
					err.loc = { file: id, line, column };
					// Compiler errors may arrive without a JS stack; capture one here.
					Error.captureStackTrace(err);
					throw err;
				}
			},
		},
	};
}

// The package each built-in processor comes from, so the error can name what to update.
const BUILT_IN_PROCESSOR_PACKAGES: Record<string, string> = {
	satteri: '@astrojs/markdown-satteri',
	unified: '@astrojs/markdown-remark',
};

function mdxUnsupportedMessage(name: string): string {
	const pkg = BUILT_IN_PROCESSOR_PACKAGES[name];
	if (pkg) {
		return `\`${pkg}\` is too old to render \`.mdx\` files. Update it to the latest version — a \`^\` range on an older version will not pick it up:\n  npm install ${pkg}@latest`;
	}
	return `The markdown processor "${name}" does not provide MDX support. Implement \`createMdxRenderer\` on the processor to enable MDX rendering.`;
}

async function resolveMdxRenderer(
	opts: VitePluginMdxOptions,
	sourcemap: boolean,
): Promise<MdxRenderer> {
	const { processor } = opts;

	if (!processor.createMdxRenderer) {
		throw new Error(mdxUnsupportedMessage(processor.name));
	}

	return processor.createMdxRenderer(
		{
			syntaxHighlight: opts.mdxOptions.syntaxHighlight,
			shikiConfig: opts.mdxOptions.shikiConfig,
			gfm: opts.mdxOptions.gfm,
			smartypants: opts.mdxOptions.smartypants,
		},
		{
			optimize: opts.mdxOptions.optimize,
			srcDir: opts.srcDir,
			sourcemap,
		},
	);
}
