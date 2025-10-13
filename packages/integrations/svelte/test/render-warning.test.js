import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from '../../../astro/test/test-utils.js';

let fixture;

describe('Render warning', () => {
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/render-warning/', import.meta.url),
		});
	});

	describe('build', () => {
		let originalWarn;
		let logs = [];

		before(() => {
			originalWarn = console.warn;
			console.warn = (message) => {
				logs.push(message);
				originalWarn(message);
			};
		});

		after(async () => {
			console.warn = originalWarn;
			logs = [];
		});

		it('does not show any render warning', async () => {
			await fixture.build();
			assert.equal(logs.length, 0);
		});
	});

	describe('dev', () => {
		/** @type {import('../../../astro/test/test-utils.js').Fixture} */
		let devServer;
		let originalWarn;
		let logs = [];

		before(async () => {
			devServer = await fixture.startDevServer();
			originalWarn = console.warn;
			console.warn = (message) => {
				logs.push(message);
				originalWarn(message);
			};
		});

		after(async () => {
			await devServer.stop();
			console.warn = originalWarn;
			logs = [];
		});

		it('does not show any render warning', async () => {
			await fixture.fetch('/');
			assert.equal(logs.length, 0);
		});
	});
});
