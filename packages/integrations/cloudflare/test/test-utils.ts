import type { PreviewServer } from 'astro';
import {
	loadFixture as baseLoadFixture,
	type AstroInlineConfig,
	type DevServer,
	type Fixture,
} from 'astro/_internal/test/test-utils';

export type { AstroInlineConfig, DevServer, Fixture, PreviewServer };

export async function loadFixture(inlineConfig: AstroInlineConfig): Promise<Fixture> {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	const fixture = await baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root as string, import.meta.url).toString(),
	});

	// For unknown reasons, the error below could raise during testing. We add a retry mechanism to handle it.
	// Some further investigation is needed to understand the root cause.
	//
	// Unable to build fixture for the attempt 1: Error: There is a new version of the pre-bundle for "/astro/packages/integrations/cloudflare/test/fixtures/with-svelte/node_modules/.vite/deps_ssr/svelte_server.js?v=9924cddf", a page reload is going to ask for it.
	const buildWithRetry: Fixture['build'] = async (...args) => {
		let err: unknown;
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				return await fixture.build(...args);
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
