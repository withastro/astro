import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, isWindows, loadFixture } from './test-utils.ts';

let fixture: Fixture;

describe('Impostor MDX File', () => {
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/impostor-mdx-file/',
			outDir: './dist/impostor-mdx-file/',
		});
	});
	if (isWindows) return;

	describe('dev', () => {
		let devServer: DevServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('does not crash when loading react component with .md or .mdx in name', async () => {
			const result = await fixture.fetch('/').then((response) => response.text());
			assert.equal(result.includes('Baz'), true);
		});
	});
});
