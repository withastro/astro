import { loadFixture as baseLoadFixture } from '../../../astro/test/test-utils.js';

/**
 * @typedef {import('../../../astro/test/test-utils').Fixture} Fixture
 */
export async function loadFixture(inlineConfig) {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	const resolvedConfig = {
		...inlineConfig,
		root: new URL(inlineConfig.root, import.meta.url).toString(),
	};

	console.log('[cloudflare:test] creating fixture', resolvedConfig.root);
	const fixture = await baseLoadFixture(resolvedConfig);
	console.log('[cloudflare:test] created fixture', resolvedConfig.root);

	return {
		...fixture,
		async build(...args) {
			console.log('[cloudflare:test] build start', resolvedConfig.root);
			const result = await fixture.build(...args);
			console.log('[cloudflare:test] build done', resolvedConfig.root);
			return result;
		},
		async preview(...args) {
			console.log('[cloudflare:test] preview start', resolvedConfig.root);
			const result = await fixture.preview(...args);
			console.log('[cloudflare:test] preview started', resolvedConfig.root);
			return result;
		},
		async startDevServer(...args) {
			console.log('[cloudflare:test] dev server start', resolvedConfig.root);
			const result = await fixture.startDevServer(...args);
			console.log('[cloudflare:test] dev server started', resolvedConfig.root);
			return result;
		},
		async clean(...args) {
			console.log('[cloudflare:test] clean start', resolvedConfig.root);
			const result = await fixture.clean(...args);
			console.log('[cloudflare:test] clean done', resolvedConfig.root);
			return result;
		},
	};
}
