import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SitemapOptionsSchema } from '../../dist/schema.js';

describe('SitemapOptionsSchema', () => {
	it('requires defaultLocale to be an own locale key', () => {
		const result = SitemapOptionsSchema.safeParse({
			i18n: {
				defaultLocale: 'constructor',
				locales: {
					en: 'en-US',
				},
			},
		});

		assert.equal(result.success, false);
	});
});
