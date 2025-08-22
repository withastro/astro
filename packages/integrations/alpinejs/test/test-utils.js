import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as testBase } from '@playwright/test';
import { loadFixture as baseLoadFixture } from '../../../astro/test/test-utils.js';

// Get all test files in directory, assign unique port for each of them so they don't conflict
const testFiles = await fs.readdir(new URL('.', import.meta.url));
const testFileToPort = new Map();
for (let i = 0; i < testFiles.length; i++) {
	const file = testFiles[i];
	if (file.endsWith('.test.js')) {
		testFileToPort.set(file.slice(0, -8), 4000 + i);
	}
}

function loadFixture(inlineConfig) {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: fileURLToPath(new URL(inlineConfig.root, import.meta.url)),
		server: {
			port: testFileToPort.get(path.basename(inlineConfig.root)),
		},
	});
}

function testFactory(inlineConfig) {
	let fixture;

	const test = testBase.extend({
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

export function prepareTestFactory(opts) {
	const test = testFactory(opts);

	let devServer;

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
