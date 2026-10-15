import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addAttribute } from '../../../dist/runtime/server/render/util.js';

describe('addAttribute URL XSS', () => {
	it('escapes double quotes in HTTP URLs containing &', () => {
		const maliciousUrl = 'https://evil.com/?a=1&b=2"+onmouseover="alert(1)';
		const result = String(addAttribute(maliciousUrl, 'href'));

		// The " must be escaped so the value stays inside a single attribute
		assert.ok(result.includes('&quot;'), `double quotes should be escaped, got: ${result}`);
		assert.match(
			result,
			/^\s+href="[^"]*"$/,
			`should be a single well-formed attribute, got: ${result}`,
		);
	});

	it('escapes & in HTTP URLs', () => {
		const url = 'https://example.com/?a=1&b=2&c=3';
		const result = String(addAttribute(url, 'href'));

		assert.ok(result.includes('&amp;'), `ampersands should be escaped, got: ${result}`);
		assert.match(
			result,
			/^\s+href="[^"]*"$/,
			`should be a single well-formed attribute, got: ${result}`,
		);
	});

	it('handles null and undefined values', () => {
		assert.equal(addAttribute(null, 'href'), '');
		assert.equal(addAttribute(undefined, 'href'), '');
	});
});
