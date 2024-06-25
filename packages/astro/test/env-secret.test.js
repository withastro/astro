import assert from 'node:assert/strict';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { after, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';
import { AstroError } from '../dist/core/errors/errors.js';

const dotEnvPath = new URL('./fixtures/astro-env-server-secret/.env', import.meta.url);

describe('astro:env secret variables', () => {
	/** @type {Awaited<ReturnType<typeof loadFixture>>} */
	let fixture;
	/** @type {Awaited<ReturnType<(typeof fixture)["loadTestAdapterApp"]>>} */
	let app;
	/** @type {Awaited<ReturnType<(typeof fixture)["startDevServer"]>>} */
	let devServer = undefined;

	after(async () => {
		await devServer?.stop();
		if (existsSync(dotEnvPath)) {
			unlinkSync(dotEnvPath);
		}
	});

	it('works in dev', async () => {
		writeFileSync(dotEnvPath, 'KNOWN_SECRET=5', 'utf-8');
		fixture = await loadFixture({
			root: './fixtures/astro-env-server-secret/',
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
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
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
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200);

		const html = await response.text();
		const $ = cheerio.load(html);

		const data = JSON.parse($('#data').text());

		assert.equal(data.KNOWN_SECRET, 123456);
		assert.equal(data.UNKNOWN_SECRET, 'abc');
	});

	it('fails if validateSecretsOnStart is enabled and secret is not set', async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-env-server-secret/',
			experimental: {
				env: {
					validateSecretsOnStart: true,
				},
			},
		});

		let error = null;
		try {
			devServer = await fixture.startDevServer();
		} catch (e) {
			error = e;
		}

		assert.equal(error instanceof AstroError, true);
		assert.equal(error.title, 'Invalid Environment Variables');
		assert.equal(error.message.includes('Variable KNOWN_SECRET is not of type: number.'), true);
	});
});
