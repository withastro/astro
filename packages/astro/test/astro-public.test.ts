import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import type { AstroLogMessage } from '../dist/core/logger/core.js';
import { AstroLogger } from '../dist/core/logger/core.js';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Public', () => {
	let fixture: Fixture;
	const buildLogs: AstroLogMessage[] = [];

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-public/' });
		const logger = new AstroLogger({
			level: 'info',
			destination: new Writable({
				objectMode: true,
				write(event, _, callback) {
					buildLogs.push(event);
					callback();
				},
			}),
		});
		await fixture.build({
			vite: {
				logLevel: 'info',
			},
			// @ts-expect-error - logger is @internal API
			logger,
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

	it('Build with external reference', async () => {
		const html = await fixture.readFile('/external-files/index.html');
		assert.equal(html.includes('<script src="/external-file.js"'), true);
	});
});

describe('Public (dev)', () => {
	let fixture: Fixture;
	let devServer: DevServer;

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
