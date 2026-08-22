import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

describe('astro add cloudflare', () => {
	// Guard against regression: the compatibility_date in the scaffolded wrangler config
	// must not use today's date, because workerd rejects dates newer than ~7 days past
	// its build date. See https://github.com/withastro/astro/issues/17796.
	it('uses a hardcoded compatibility date instead of the current date', () => {
		const source = readFileSync(
			fileURLToPath(new URL('../../../src/cli/add/index.ts', import.meta.url)),
			'utf-8',
		);

		// The old, broken pattern: generating the date dynamically
		const dynamicDatePattern = /compatibilityDate\s*=\s*new Date\(\)/;
		assert.equal(
			dynamicDatePattern.test(source),
			false,
			'compatibility_date must not use new Date() — workerd rejects dates past its binary max',
		);

		// Verify the hardcoded constant exists
		const hardcodedDatePattern = /CLOUDFLARE_COMPATIBILITY_DATE\s*=\s*'\d{4}-\d{2}-\d{2}'/;
		assert.equal(
			hardcodedDatePattern.test(source),
			true,
			'CLOUDFLARE_COMPATIBILITY_DATE constant with a YYYY-MM-DD value must exist',
		);
	});
});
