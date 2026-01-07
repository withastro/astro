import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { before, describe, it } from 'node:test';
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
});
