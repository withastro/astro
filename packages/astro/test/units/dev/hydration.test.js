import { expect } from 'chai';
import { fileURLToPath } from 'node:url';
import { createFs, createRequestAndResponse, runInContainer } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('hydration', () => {
	it('should not crash when reassigning a hydrated component', async () => {
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
				expect(res.statusCode).to.equal(
					200,
					"We get a 200 because the error occurs in the template, but we didn't crash!"
				);
			}
		);
	});
});
