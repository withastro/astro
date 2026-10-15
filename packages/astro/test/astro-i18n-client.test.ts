import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('i18n client import', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/i18n-client-import/',
			outDir: './dist/i18n-client-import/',
			cacheDir: './node_modules/.astro-test/i18n-client-import/',
		});
	});

	it('builds successfully when astro:i18n is imported from a client <script>', async () => {
		await fixture.build();
	});
});
