import { fileURLToPath } from 'node:url';
import { test as testBase } from '@playwright/test';
import {
	loadFixture as baseLoadFixture,
	type Fixture,
	type AstroInlineConfig,
	type DevServer,
} from '../../../astro/test/test-utils.js';

function loadFixture(inlineConfig: AstroInlineConfig) {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: fileURLToPath(new URL(inlineConfig.root, import.meta.url)),
	});
}

function testFactory(inlineConfig: AstroInlineConfig) {
	let fixture: Fixture;

	const test = testBase.extend<{ astro: Fixture }>({
		// biome-ignore lint/correctness/noEmptyPattern: playwright needs this
		astro: async ({}, use) => {
			fixture = fixture || (await loadFixture(inlineConfig));
			await use(fixture);
		},
	});

	test.afterEach(() => {
		fixture.resetAllFiles();
	});

	return test;
}

export function prepareTestFactory(opts: AstroInlineConfig) {
	const test = testFactory(opts);

	let devServer: DevServer;

	test.beforeAll(async ({ astro }) => {
		devServer = await astro.startDevServer();
	});

	test.afterAll(async () => {
		await devServer.stop();
	});

	return {
		test,
	};
}
