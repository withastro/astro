import { expect } from 'chai';
import * as cheerio from 'cheerio';

import { runInContainer } from '../../../dist/core/dev/index.js';
import { createFs, createRequestAndResponse, triggerFSEvent } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('dev container', () => {
	it('can render requests', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `
				---
				const name = 'Testing';
				---
				<html>
					<head><title>{name}</title></head>
					<body>
						<h1>{name}</h1>
					</body>
				</html>
			`,
			},
			root
		);

		await runInContainer({ fs, root }, async (container) => {
			const { req, res, text } = createRequestAndResponse({
				method: 'GET',
				url: '/',
			});
			container.handle(req, res);
			const html = await text();
			const $ = cheerio.load(html);
			expect(res.statusCode).to.equal(200);
			expect($('h1')).to.have.a.lengthOf(1);
		});
	});

	it('HMR only short circuits on previously cached modules', async () => {
		const fs = createFs(
			{
				'/src/components/Header.astro': `
					<h1>{Astro.props.title}</h1>
				`,
				'/src/pages/index.astro': `
					---
					import Header from '../components/Header.astro';
					const name = 'Testing';
					---
					<html>
						<head><title>{name}</title></head>
						<body class="one">
							<Header title={name} />
						</body>
					</html>
				`,
			},
			root
		);

		await runInContainer({ fs, root }, async (container) => {
			let r = createRequestAndResponse({
				method: 'GET',
				url: '/',
			});
			container.handle(r.req, r.res);
			let html = await r.text();
			let $ = cheerio.load(html);
			expect($('body.one')).to.have.a.lengthOf(1);

			fs.writeFileFromRootSync('/src/components/Header.astro', `
				<h1>{Astro.props.title}</h1>
			`);
			triggerFSEvent(container, fs, '/src/components/Header.astro', 'change');
			
			fs.writeFileFromRootSync('/src/pages/index.astro', `
				---
				import Header from '../components/Header.astro';
				const name = 'Testing';
				---
				<html>
					<head><title>{name}</title></head>
					<body class="two">
						<Header title={name} />
					</body>
				</html>
			`);
			triggerFSEvent(container, fs, '/src/pages/index.astro', 'change');

			r = createRequestAndResponse({
				method: 'GET',
				url: '/',
			});
			container.handle(r.req, r.res);
			html = await r.text();
			$ = cheerio.load(html);
			expect($('body.one')).to.have.a.lengthOf(0);
			expect($('body.two')).to.have.a.lengthOf(1);
		});
	});
});
