import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

async function captureStdoutLogs(run) {
	const originalWrite = process.stdout.write.bind(process.stdout);
	let output = '';
	process.stdout.write = (chunk, encoding, callback) => {
		output += chunk?.toString?.() ?? '';
		if (typeof callback === 'function') callback();
		return true;
	};
	try {
		await run();
	} finally {
		process.stdout.write = originalWrite;
	}
	return output;
}

describe('Partials', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/partials/',
			logLevel: 'warn',
		});
	});

	describe('dev', () => {
		/** @type {import('./test-utils.js').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('is only the written HTML', async () => {
			const html = await fixture.fetch('/partials/item/').then((res) => res.text());
			assert.equal(html.startsWith('<li'), true);
		});

		it('Nested conditionals render', async () => {
			const html = await fixture.fetch('/partials/nested-conditional/').then((res) => res.text());
			const $ = cheerio.load(html);
			assert.equal($('#true').text(), 'test');
		});

		it('warns when partial pages include styles or scripts', async () => {
			const output = await captureStdoutLogs(async () => {
				await fixture.fetch('/partials/with-assets/').then((res) => res.text());
			});
			assert.match(output, /rendered as a partial, so scoped styles and scripts are stripped/);
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('is only the written HTML', async () => {
			const html = await fixture.readFile('/partials/item/index.html');
			assert.equal(html.startsWith('<li>'), true);
		});

		it('Works with mdx', async () => {
			const html = await fixture.readFile('/partials/docs/index.html');
			assert.equal(html.startsWith('<h1'), true);
		});

		it('warns during build when partial pages include styles or scripts', async () => {
			const output = await captureStdoutLogs(async () => {
				await fixture.build();
			});
			assert.match(output, /rendered as a partial, so scoped styles and scripts are stripped/);
		});
	});
});
