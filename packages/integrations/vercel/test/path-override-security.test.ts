import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

async function loadFunctionModule(fixture: Fixture, functionName: string) {
	const functionConfig = JSON.parse(
		await fixture.readFile(`../.vercel/output/functions/${functionName}.func/.vc-config.json`),
	);
	const functionEntry = new URL(
		`../.vercel/output/functions/${functionName}.func/${functionConfig.handler}`,
		fixture.config.outDir,
	);

	return import(functionEntry.href);
}

describe('Vercel serverless path override security', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/serverless-with-dynamic-routes/',
			output: 'server',
		});
		await fixture.build({});
	});

	it('ignores untrusted x_astro_path query param on _render', async () => {
		const renderFunction = await loadFunctionModule(fixture, '_render');
		const response = await renderFunction.default.fetch(
			new Request('https://example.com/api/public?x_astro_path=/api/private'),
		);
		const body = await response.json();

		assert.equal(body.id, 'public');
	});

	it('ignores untrusted x-astro-path header on _render', async () => {
		const renderFunction = await loadFunctionModule(fixture, '_render');
		const response = await renderFunction.default.fetch(
			new Request('https://example.com/api/public', {
				headers: {
					'x-astro-path': '/api/private',
				},
			}),
		);
		const body = await response.json();

		assert.equal(body.id, 'public');
	});
});
