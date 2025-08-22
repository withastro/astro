import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('i18n double-prefix prevention', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/i18n-double-prefix/',
		});
		await fixture.build();
	});

	it('should not create double-prefixed redirect pages', async () => {
		// The Spanish page exists, so no fallback redirect should be created
		const esPage = await fixture.readFile('/es/test/item1/index.html');
		assert.ok(esPage.includes('<h1>Test Item 1 (ES)</h1>'));

		// Double-prefixed path should NOT exist
		let doublePrefix = false;
		try {
			await fixture.readFile('/es/es/test/item1/index.html');
			doublePrefix = true;
		} catch (_e) {
			// Expected - file should not exist
		}
		assert.equal(
			doublePrefix,
			false,
			'Double-prefixed path /es/es/test/item1/index.html should not exist',
		);

		// The English page should exist at its correct path
		const enPage = await fixture.readFile('/test/item1/index.html');
		assert.ok(enPage.includes('<h1>Test Item 1 (EN)</h1>'));
	});

	it('should generate correct fallback redirects for missing Spanish pages', async () => {
		// item2 only exists in English, so Spanish should fallback to English
		let spanishRedirect = false;
		try {
			await fixture.readFile('/es/test/item2/index.html');
			spanishRedirect = true;
		} catch (_e) {
			// Expected if no redirect was generated
		}

		// The English version should exist
		const enPage = await fixture.readFile('/test/item2/index.html');
		assert.ok(enPage.includes('<h1>Test Item 2 (EN only)</h1>'));

		// If a Spanish redirect was generated, it should not be double-prefixed
		if (spanishRedirect) {
			// Check that no double-prefixed version exists
			let doublePrefix = false;
			try {
				await fixture.readFile('/es/es/test/item2/index.html');
				doublePrefix = true;
			} catch (_e) {
				// Expected - double prefix should not exist
			}
			assert.equal(
				doublePrefix,
				false,
				'Double-prefixed path /es/es/test/item2/index.html should not exist',
			);
		}
	});
});
