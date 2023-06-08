import { test as testBase } from '@playwright/test';

export function testFactory(inlineConfig) {
	let fixture;

	const test = testBase.extend({
		astro: async ({}, use) => {
			fixture = await loadFixture(inlineConfig);
			await use(fixture);
		},
	});

	test.afterEach(() => {
		fixture.resetAllFiles();
	});

	return test;
}
