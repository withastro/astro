import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './_test-utils.js';
import { Logger } from '../../../astro/dist/core/logger/core.js';
import { fileURLToPath } from 'node:url';

describe('React', () => {
	let fixture;
	let previewServer;
	const logs = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/with-react/',
		});

		// Clear the Vite cache before testing
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);

		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		await fixture.build({
			vite: { logLevel: 'debug' },
			logger: new Logger({
				level: 'debug',
				dest: new Writable({
					objectMode: true,
					write(event, _, callback) {
						logs.push(event);
						callback();
					},
				}),
			}),
		});
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
		await fixture.clean();
	});

	it('renders the react component', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('.react').text(), 'React Content');
	});

	// ref: https://github.com/withastro/astro/issues/15796
	// without pre-optimizing picomatch, a build error occurs in standard repositories, but it's not triggered in this monorepo.
	// as a workaround, we verify the fix by checking if the "new dependencies optimized" log is output.
	it('picomatch should be pre-optimized', async () => {
		const picomatchDependenciesOptimizedLog = logs.find(
			(log) =>
				log.message &&
				log.message.includes('new dependencies optimized') &&
				log.message.includes('picomatch'),
		);

		assert.ok(
			!picomatchDependenciesOptimizedLog,
			`Should not see "new dependencies optimized: picomatch" message, but got: ${picomatchDependenciesOptimizedLog?.message}`,
		);
	});
});
