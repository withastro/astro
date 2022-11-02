import { expect } from 'chai';
import * as cheerio from 'cheerio';

import { createContainerWithAutomaticRestart, runInContainer } from '../../../dist/core/dev/index.js';
import { createFs, createRequestAndResponse } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('dev container restarts', () => {
	it('Surfaces config errors on restarts', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `
				<html>
					<head><title>Test</title></head>
					<body>
						<h1>Test</h1>
					</body>
				</html>
			`,
				'/astro.config.mjs': `
				
				`
			},
			root
		);

		let restart = await createContainerWithAutomaticRestart({
			params: { fs, root }
		});

		try {
			let r = createRequestAndResponse({
				method: 'GET',
				url: '/',
			});
			restart.container.handle(r.req, r.res);
			let html = await r.text();
			const $ = cheerio.load(html);
			expect(r.res.statusCode).to.equal(200);
			expect($('h1')).to.have.a.lengthOf(1);
	
			// Create an error
			let restartComplete = restart.restarted();
			fs.writeFileFromRootSync('/astro.config.mjs', 'const foo = bar');

			// Vite watches the real filesystem, so we have to mock this part. It's not so bad.
			restart.container.viteServer.watcher.emit('change', fs.getFullyResolvedPath('/astro.config.mjs'));

			// Wait for the restart to finish
			let hmrError = await restartComplete;
			expect(hmrError).to.not.be.a('undefined');

			// Do it a second time to make sure we are still watching

			restartComplete = restart.restarted();
			fs.writeFileFromRootSync('/astro.config.mjs', 'const foo = bar2');

			// Vite watches the real filesystem, so we have to mock this part. It's not so bad.
			restart.container.viteServer.watcher.emit('change', fs.getFullyResolvedPath('/astro.config.mjs'));

			hmrError = await restartComplete;
			expect(hmrError).to.not.be.a('undefined');
		} finally {
			await restart.container.close();
		}
	});
});
