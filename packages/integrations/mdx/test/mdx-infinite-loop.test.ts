import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import mdx from '@astrojs/mdx';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('MDX Infinite Loop', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-infinite-loop/', import.meta.url),
			integrations: [mdx()],
		});
	});

	describe('build', () => {
		let err: unknown;
		before(async () => {
			try {
				await fixture.build();
			} catch (e) {
				err = e;
			}
		});

		it('does not hang forever if an error is thrown', async () => {
			assert.equal(!!err, true);
		});
	});
});
