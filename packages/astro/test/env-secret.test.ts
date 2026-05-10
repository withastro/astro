import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import type { AstroError } from '../dist/core/errors/errors.js';
import testAdapter from './test-adapter.ts';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('astro:env secret variables', () => {
	let fixture: Fixture;
	let devServer: DevServer | undefined;

	afterEach(async () => {
		await devServer?.stop();
		if (process.env.KNOWN_SECRET) {
			delete process.env.KNOWN_SECRET;
		}
	});

	it('works in dev', async () => {
		process.env.KNOWN_SECRET = '5';
		fixture = await loadFixture({
			root: './fixtures/astro-env-server-secret/',
			outDir: './dist/env-secret-astro-env-secret-variables/',
		});
		devServer = await fixture.startDevServer();
		const response = await fixture.fetch('/');
		assert.equal(response.status, 200);
	});

	it('builds without throwing', async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-env-server-secret/',
			output: 'server',
			adapter: testAdapter({
				env: {
					KNOWN_SECRET: '123456',
					UNKNOWN_SECRET: 'abc',
				},
			}),
			outDir: './dist/env-secret-astro-env-secret-variables/',
		});
		await fixture.build();
		assert.equal(true, true);
	});

	it('adapter can set how env is retrieved', async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-env-server-secret/',
			output: 'server',
			adapter: testAdapter({
				env: {
					KNOWN_SECRET: '123456',
					UNKNOWN_SECRET: 'abc',
				},
			}),
			outDir: './dist/env-secret-astro-env-secret-variables/',
		});
		await fixture.build();
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200);

		const html = await response.text();
		const $ = cheerio.load(html);

		const data = JSON.parse($('#data').text());

		assert.equal(data.KNOWN_SECRET, 123456);
		assert.equal(data.UNKNOWN_SECRET, 'abc');
	});

	it('fails if validateSecrets is enabled and secret is not set', async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-env-server-secret/',
			env: {
				validateSecrets: true,
			},
			outDir: './dist/env-secret-astro-env-secret-variables/',
		});

		try {
			await fixture.build();
			assert.fail();
		} catch (e) {
			const error = e as AstroError;
			assert.equal(error instanceof Error, true);
			assert.equal(error.title, 'Invalid Environment Variables');
			assert.equal(error.message.includes('KNOWN_SECRET is missing'), true);
		}
	});
});
