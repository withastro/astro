import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.js';

describe('build format', () => {
	describe('build.format: file', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-page-directory-url',
				build: {
					format: 'file',
				},
			});
			await fixture.build();
		});

		it('outputs', async () => {
			assert.ok(await fixture.readFile('/client.html'));
			assert.ok(await fixture.readFile('/nested-md.html'));
			assert.ok(await fixture.readFile('/nested-astro.html'));
		});
	});

	describe('build.format: preserve', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-page-directory-url',
				build: {
					format: 'preserve',
				},
			});
			await fixture.build();
		});

		it('outputs', async () => {
			assert.ok(await fixture.readFile('/client.html'));
			assert.ok(await fixture.readFile('/nested-md/index.html'));
			assert.ok(await fixture.readFile('/nested-astro/index.html'));
		});
	});
});
