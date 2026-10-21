import type { AstroConfig } from '../../../types/public/config.js';

/**
 * Projection of {@link AstroConfig} limited to values that can change the bytes
 * or paths of a prerendered page. A change to any of these must invalidate the
 * incremental build cache: the per-route dependency hash only sees module
 * *source*, so it misses config baked into compiled output by the compiler
 * (`compressHTML`, `site`, `scopedStyleStrategy`), inlined via Vite `define`
 * (`base`, `build.assetsPrefix`), or serialized into virtual modules (`image`,
 * `env.schema`, `i18n`).
 *
 * Only serializable values are included. Function-valued config (integrations,
 * vite/remark/rehype plugins, image services) is omitted because it cannot be
 * serialized. `outDir`/`publicDir` are omitted too, since they move where files
 * are written without changing a page's bytes.
 *
 * The whole `vite` config cannot be hashed: it carries plugins and other
 * function-valued, per-run state that churns between builds and would sink the
 * cache hit rate. Instead a curated allowlist of serializable Vite options that
 * change emitted bytes or asset paths is included (e.g. `build.assetsInlineLimit`
 * flips an asset between an inlined data URI and a separate hashed file). This
 * allowlist is best-effort, so an obscure output-affecting Vite option outside
 * it will not invalidate the cache; `--force` is the escape hatch.
 *
 * The set of fields is asserted against the full config schema in
 * `test/units/build/config-hash.test.ts`, which fails when a new top-level
 * config key appears so it gets classified here or explicitly excluded.
 */
export function getConfigHashInput(config: AstroConfig) {
	return {
		site: config.site,
		base: config.base,
		trailingSlash: config.trailingSlash,
		output: config.output,
		compressHTML: config.compressHTML,
		scopedStyleStrategy: config.scopedStyleStrategy,
		build: {
			format: config.build.format,
			assets: config.build.assets,
			assetsPrefix: config.build.assetsPrefix,
			inlineStylesheets: config.build.inlineStylesheets,
			redirects: config.build.redirects,
		},
		redirects: config.redirects,
		i18n: config.i18n,
		image: config.image,
		markdown: config.markdown,
		env: { schema: config.env?.schema },
		security: { csp: config.security?.csp },
		prefetch: config.prefetch,
		vite: {
			build: {
				assetsInlineLimit: config.vite.build?.assetsInlineLimit,
				minify: config.vite.build?.minify,
				cssMinify: config.vite.build?.cssMinify,
				cssTarget: config.vite.build?.cssTarget,
				target: config.vite.build?.target,
			},
			css: config.vite.css,
			json: config.vite.json,
			define: config.vite.define,
			oxc: config.vite.oxc,
		},
		experimental: {
			clientPrerender: config.experimental.clientPrerender,
		},
	};
}
