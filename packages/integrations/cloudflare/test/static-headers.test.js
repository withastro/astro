import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';

const root = new URL('./fixtures/static-headers/', import.meta.url);

describe('Static headers', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root });
		await fixture.build();
	});

	it('adds CSP headers when enabled', async () => {
		const headersFileContent = await fixture.readFile('./_headers');

		// Parse the headers file content
		const headersByPattern = parseHeadersFile(headersFileContent);

		// Check if the root path '/' has CSP headers
		assert.ok(headersByPattern.has('/'), 'the / path must exist in headers file');
		assert.ok(
			headersByPattern.has('/parent/*/page'),
			'the /parent/*/page path must exist in headers file',
		);

		const indexHeaders = headersByPattern.get('/');
		assert.ok('Content-Security-Policy' in indexHeaders, 'the index must have CSP headers');
		assert.ok(
			indexHeaders['Content-Security-Policy'].includes('script-src'),
			'must contain the script-src directive because of the server island',
		);
	});

	it('copies headers from the existing _headers file', async () => {
		const headersFileContent = await fixture.readFile('./_headers');

		// Parse the headers file content
		const headersByPattern = parseHeadersFile(headersFileContent);

		// Check if the root path '/' has the expected headers
		assert.ok(
			headersByPattern.has('/has-header'),
			'the has-header path must exist in headers file',
		);
		const hasHeaderHeaders = headersByPattern.get('/has-header');
		assert.ok(
			'cdn-cache-control' in hasHeaderHeaders,
			'the has-header must have cdn-cache-control header',
		);
		assert.equal(
			hasHeaderHeaders['cdn-cache-control'],
			'public, max-age=3600',
			'must have cdn-cache-control set to public, max-age=3600',
		);
	});
});

/**
 * Parse the _headers file content into a Map of patterns to header objects
 * @param {string} content - The content of the _headers file
 * @returns {Map<string, Record<string, string>>} - Map of patterns to header objects
 */
function parseHeadersFile(content) {
	const headersByPattern = new Map();
	const lines = content.split('\n');
	let currentPattern = null;

	for (const line of lines) {
		const trimmedLine = line.trim();

		// Skip empty lines
		if (!trimmedLine) continue;

		// If not indented, this is a pattern
		if (!line.startsWith(' ') && !line.startsWith('\t')) {
			currentPattern = trimmedLine;
			if (!headersByPattern.has(currentPattern)) {
				headersByPattern.set(currentPattern, {});
			}
			continue;
		}

		// If indented and we have a current pattern, this is a header
		if (currentPattern) {
			const colonIndex = trimmedLine.indexOf(':');
			if (colonIndex > 0) {
				const name = trimmedLine.substring(0, colonIndex).trim();
				const value = trimmedLine.substring(colonIndex + 1).trim();
				const patternHeaders = headersByPattern.get(currentPattern);
				patternHeaders[name] = value;
			}
		}
	}

	return headersByPattern;
}
