import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture, type Fixture } from './test-utils.ts';
import mdx from '../dist/index.js';

const FIXTURE_ROOT = new URL('./fixtures/invalid-mdx-component/', import.meta.url);

describe('MDX component with runtime error', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: FIXTURE_ROOT,
			integrations: [mdx()],
		});
	});

	describe('build', () => {
		let error: Error | null = null;

		before(async () => {
			error = null;
			try {
				await fixture.build();
			} catch (e) {
				error = e as Error;
			}
		});

		it('Throws the right error', async () => {
			assert.ok(error);
			assert.match(
				(error as Error & { hint?: string })?.hint ?? '',
				/This issue often occurs when your MDX component encounters runtime errors/,
			);
		});
	});
});
