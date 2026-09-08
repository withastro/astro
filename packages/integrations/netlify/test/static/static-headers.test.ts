import * as assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from '../test-utils.ts';

describe('Static headers', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/static-headers/', import.meta.url) });
		await fixture.build();
	});

	it('SSR function is generated when server islands are used with output: static', async () => {
		const ssrFunctionDir = new URL(
			'./fixtures/static-headers/.netlify/v1/functions/ssr/',
			import.meta.url,
		);
		assert.ok(existsSync(ssrFunctionDir), 'SSR function directory should exist');
		assert.ok(readdirSync(ssrFunctionDir).length > 0, 'SSR function directory should not be empty');
	});

	it('CSP headers are added when CSP is enabled', async () => {
		const config = await fixture.readFile('../.netlify/v1/config.json');
		const headers: Array<{ for: string; values: Record<string, string> }> =
			JSON.parse(config).headers;
		const index = headers.find((x) => x.for === '/')!;

		assert.notEqual(index, undefined, 'the index must have CSP headers');
		assert.notEqual(
			index.values['Content-Security-Policy'],
			undefined,
			'the index must have CSP headers',
		);
		assert.ok(
			index.values['Content-Security-Policy']!.includes('script-src'),
			'must contain the script-src directive because of the server island',
		);
	});
});
