import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('JSX Queue Rendering', () => {
	describe('Output comparison', () => {
		let fixtureQueue: Fixture;
		let fixtureString: Fixture;

		before(async () => {
			// Build the fixture to its own output directory.
			fixtureQueue = await loadFixture({
				root: './fixtures/jsx-queue-rendering/',
				outDir: './dist/queue',
			});
			await fixtureQueue.build();

			// Build the same fixture again to a separate output directory, so the
			// two outputs can be compared below.
			fixtureString = await loadFixture({
				root: './fixtures/jsx-queue-rendering/',
				outDir: './dist/string',
			});
			await fixtureString.build();
		});

		it('simple.html should match between queue and string rendering', async () => {
			const queueHtml = await fixtureQueue.readFile('/simple/index.html');
			const stringHtml = await fixtureString.readFile('/simple/index.html');

			assert.equal(queueHtml, stringHtml, 'simple.html output should be identical');
		});

		it('nested.html should match between queue and string rendering', async () => {
			const queueHtml = await fixtureQueue.readFile('/nested/index.html');
			const stringHtml = await fixtureString.readFile('/nested/index.html');

			assert.equal(queueHtml, stringHtml, 'nested.html output should be identical');
		});

		it('special-elements.html should match between queue and string rendering', async () => {
			const queueHtml = await fixtureQueue.readFile('/special-elements/index.html');
			const stringHtml = await fixtureString.readFile('/special-elements/index.html');

			assert.equal(queueHtml, stringHtml, 'special-elements.html output should be identical');
		});

		it('mdx-simple.html should match between queue and string rendering', async () => {
			const queueHtml = await fixtureQueue.readFile('/mdx-simple/index.html');
			const stringHtml = await fixtureString.readFile('/mdx-simple/index.html');

			assert.equal(queueHtml, stringHtml, 'mdx-simple.html output should be identical');
		});

		it('mdx-nested.html should match between queue and string rendering', async () => {
			const queueHtml = await fixtureQueue.readFile('/mdx-nested/index.html');
			const stringHtml = await fixtureString.readFile('/mdx-nested/index.html');

			assert.equal(queueHtml, stringHtml, 'mdx-nested.html output should be identical');
		});
	});
});
