import type { UserConfig } from 'vite';
import type { CrawlFrameworkPkgsResult } from 'vitefu';
import { crawlFrameworkPkgs } from 'vitefu';

// In-process cache for crawlFrameworkPkgs results. The crawl walks the entire
// node_modules tree reading package.json files, which is expensive and produces
// the same result for a given (root, isBuild) pair within a single process lifetime.
const _crawlCache = new Map<string, CrawlFrameworkPkgsResult>();

function cloneCrawlResult(result: CrawlFrameworkPkgsResult): CrawlFrameworkPkgsResult {
	return {
		optimizeDeps: {
			include: [...result.optimizeDeps.include],
			exclude: [...result.optimizeDeps.exclude],
		},
		ssr: {
			noExternal: [...result.ssr.noExternal],
			external: [...result.ssr.external],
		},
	};
}

/**
 * Clear the crawlFrameworkPkgs cache. Call this when node_modules may have
 * changed (e.g. after a dev server restart triggered by config/lockfile change).
 */
export function clearCrawlCache(): void {
	_crawlCache.clear();
}

/** Finds Astro-related packages in `node_modules` that Vite must bundle or optimize. */
export async function getAstroPkgsConfig({
	root,
	isBuild,
	viteUserConfig,
}: {
	root: string;
	isBuild: boolean;
	viteUserConfig: UserConfig;
}): Promise<CrawlFrameworkPkgsResult> {
	const crawlCacheKey = `${root}:${isBuild}`;
	let astroPkgsConfig = _crawlCache.get(crawlCacheKey);
	if (!astroPkgsConfig) {
		astroPkgsConfig = await crawlFrameworkPkgs({
			root,
			isBuild,
			viteUserConfig,
			isFrameworkPkgByJson(pkgJson) {
				// Certain packages will trigger the checks below, but need to be external. A common example are SSR adapters
				// for node-based platforms, as we need to control the order of the import paths to make sure polyfills are applied in time.
				if (pkgJson?.astro?.external === true) {
					return false;
				}

				return (
					// Attempt: package relies on `astro`. ✅ Definitely an Astro package
					pkgJson.peerDependencies?.astro ||
					pkgJson.dependencies?.astro ||
					// Attempt: package is tagged with `astro` or `astro-component`. ✅ Likely a community package
					pkgJson.keywords?.includes('astro') ||
					pkgJson.keywords?.includes('astro-component') ||
					// Attempt: package is named `astro-something` or `@scope/astro-something`. ✅ Likely a community package
					/^(?:@[^/]+\/)?astro-/.test(pkgJson.name)
				);
			},
			isFrameworkPkgByName(pkgName) {
				const isNotAstroPkg = isCommonNotAstro(pkgName);
				if (isNotAstroPkg) {
					return false;
				} else {
					return undefined;
				}
			},
		});
		_crawlCache.set(crawlCacheKey, astroPkgsConfig);
	}

	// Return a clone so consumers can't mutate the cached result
	return cloneCrawlResult(astroPkgsConfig);
}

const COMMON_DEPENDENCIES_NOT_ASTRO = [
	'autoprefixer',
	'react',
	'react-dom',
	'preact',
	'preact-render-to-string',
	'vue',
	'svelte',
	'solid-js',
	'lit',
	'cookie',
	'dotenv',
	'esbuild',
	'eslint',
	'jest',
	'postcss',
	'prettier',
	'astro',
	'tslib',
	'typescript',
	'vite',
];

const COMMON_PREFIXES_NOT_ASTRO = [
	'@webcomponents/',
	'@fontsource/',
	'@postcss-plugins/',
	'@rolldown/',
	'@rollup/',
	'@astrojs/renderer-',
	'@types/',
	'@typescript-eslint/',
	'eslint-',
	'jest-',
	'postcss-plugin-',
	'prettier-plugin-',
	'remark-',
	'rehype-',
	'rolldown-plugin-',
	'rollup-plugin-',
	'vite-plugin-',
];

function isCommonNotAstro(dep: string): boolean {
	return (
		COMMON_DEPENDENCIES_NOT_ASTRO.includes(dep) ||
		COMMON_PREFIXES_NOT_ASTRO.some(
			(prefix) =>
				prefix.startsWith('@')
					? dep.startsWith(prefix)
					: dep.substring(dep.lastIndexOf('/') + 1).startsWith(prefix), // check prefix omitting @scope/
		)
	);
}
