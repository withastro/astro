import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateSpeculationRulesContent } from '../../../dist/prefetch/speculation-rules.js';
import { generateCspDigest } from '../../../dist/core/encryption.js';

describe('speculation rules CSP integration', () => {
	it('generates document-source speculation rules with data-astro-prefetch selector', () => {
		const content = generateSpeculationRulesContent(false);
		const parsed = JSON.parse(content);
		assert.equal(parsed.prerender[0].source, 'document');
		assert.equal(parsed.prerender[0].where.selector_matches, 'a[data-astro-prefetch]');
		assert.equal(parsed.prefetch[0].source, 'document');
		assert.equal(parsed.prefetch[0].where.selector_matches, 'a[data-astro-prefetch]');
	});

	it('uses "a" selector when prefetchAll is true', () => {
		const content = generateSpeculationRulesContent(true);
		const parsed = JSON.parse(content);
		assert.equal(parsed.prerender[0].where.selector_matches, 'a');
		assert.equal(parsed.prefetch[0].where.selector_matches, 'a');
	});

	it('produces a deterministic hash for CSP', async () => {
		const content1 = generateSpeculationRulesContent(false);
		const content2 = generateSpeculationRulesContent(false);
		assert.equal(content1, content2);

		const hash = await generateCspDigest(content1, 'SHA-256');
		assert.equal(typeof hash, 'string');
		assert.ok(hash.length > 0);

		// Same content always produces same hash
		const hash2 = await generateCspDigest(content2, 'SHA-256');
		assert.equal(hash, hash2);
	});
});
