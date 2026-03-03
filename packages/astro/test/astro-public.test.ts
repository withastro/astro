import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import { Logger } from '../dist/core/logger/core.js';
import { loadFixture } from './test-utils.js';

describe('Public', () => {
	let fixture;
	let buildLogs = [];

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-public/' });
		await fixture.build({
			vite: {
				logLevel: 'info',
			},
			logger: new Logger({
				level: 'info',
				dest: new Writable({
					objectMode: true,
					write(event, _, callback) {
						buildLogs.push(event);
						callback();
					},
				}),
			}),
		});
	});

	it('css and js files do not get bundled', async () => {
		let indexHtml = await fixture.readFile('/index.html');
		assert.equal(indexHtml.includes('<script src="/example.js"></script>'), true);
		assert.equal(indexHtml.includes('<link href="/example.css" rel="stylesheet">'), true);
		assert.equal(indexHtml.includes('<img src="/images/twitter.png">'), true);
	});

	it('should not produce empty chunk warning when building with no client JS', () => {
		// Check for empty chunk warnings in the build logs
		const emptyChunkWarning = buildLogs.find(
			(log) =>
				log.message &&
				(log.message.includes('empty chunk') ||
					(log.message.includes('empty') && log.message.includes('chunk'))),
		);

		if (emptyChunkWarning) {
			assert.fail(`Should not have empty chunk warning, but got: ${emptyChunkWarning.message}`);
		}
	});

	it('public file takes priority over API route in build', async () => {
		// When both public/robots.txt and src/pages/robots.txt.ts exist,
		// the public file should take priority
		const robotsTxt = await fixture.readFile('/robots.txt');
		assert.match(robotsTxt, /Disallow: \/admin\//, 'Should contain public file content');
		assert.doesNotMatch(robotsTxt, /Disallow: \/\n/, 'Should not contain API route content');
	});
});

describe('Public (dev)', () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-public/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('public file takes priority over API route in dev', async () => {
		// When both public/robots.txt and src/pages/robots.txt.ts exist,
		// the public file should take priority
		const response = await fixture.fetch('/robots.txt');
		assert.equal(response.status, 200);
		const text = await response.text();
		assert.match(text, /Disallow: \/admin\//, 'Should contain public file content');
		assert.doesNotMatch(text, /Disallow: \/\n/, 'Should not contain API route content');
	});
});
