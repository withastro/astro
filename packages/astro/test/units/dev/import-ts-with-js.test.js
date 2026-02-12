import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { createFixture, createRequestAndResponse, runInContainer } from '../test-utils.js';

describe('Using .js extension on .ts file', () => {
	it('works in .astro files', async () => {
		const fixture = await createFixture({
			'/src/bar.ts': `export default function() { return 'bar'; }`,
			'/src/foo.ts': `import bar from './bar.js';\nexport default bar;`,
			'/src/pages/index.astro': `
---
import foo from '../foo.js';
---
<html>
	<head><title></title></head>
	<body>
		<h1>{ foo() }</h1>
	</body>
</html>`,
		});

		await runInContainer({ inlineConfig: { root: fixture.path } }, async (container) => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/',
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'bar');
		});
	});
});
