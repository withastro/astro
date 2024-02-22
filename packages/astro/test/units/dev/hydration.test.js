import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createFs, createRequestAndResponse, runInContainer } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('hydration', () => {
	it(
		'should not crash when reassigning a hydrated component',
		{ skip: true, todo: "It seems that `components/Client.svelte` isn't found" },
		async () => {
			const fs = createFs(
				{
					'/src/pages/index.astro': `
				---
				import Svelte from '../components/Client.svelte';
				const Foo = Svelte;
				const Bar = Svelte;
				---
				<html>
					<head><title>testing</title></head>
					<body>
						<Foo client:load />
						<Bar client:load />
					</body>
				</html>
			`,
				},
				root
			);

			await runInContainer(
				{
					fs,
					inlineConfig: {
						root: fileURLToPath(root),
						logLevel: 'silent',
					},
				},
				async (container) => {
					const { req, res, done } = createRequestAndResponse({
						method: 'GET',
						url: '/',
					});
					container.handle(req, res);
					await done;
					assert.equal(
						res.statusCode,
						200,
						"We get a 200 because the error occurs in the template, but we didn't crash!"
					);
				}
			);
		}
	);
});
