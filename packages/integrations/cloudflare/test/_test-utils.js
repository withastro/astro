import { loadFixture as baseLoadFixture } from '../../../astro/test/test-utils.js';

/**
 * @typedef {import('../../../astro/test/test-utils').Fixture} Fixture
 */
export async function loadFixture(inlineConfig) {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	const fixture = await baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root, import.meta.url).toString(),
	});

	// For unknown reasons, the error below could raise during testing. We add a retry mechanism to handle it.
	// Some further investigation is needed to understand the root cause.
	//
	// Unable to build fixture for the attempt 1: Error: There is a new version of the pre-bundle for "/astro/packages/integrations/cloudflare/test/fixtures/with-svelte/node_modules/.vite/deps_ssr/svelte_server.js?v=9924cddf", a page reload is going to ask for it.
	const buildWithRetry = async function (...args) {
		let err;
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				const result = await fixture.build(...args);
				return result;
			} catch (error) {
				console.error(`Unable to build fixture for the attempt ${attempt}:`, error);
				err = error;
			}
		}

		if (err) {
			throw err;
		}
	};

	return { ...fixture, build: buildWithRetry };
}
