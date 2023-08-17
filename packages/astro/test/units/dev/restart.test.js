import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

import {
	createContainerWithAutomaticRestart,
	startContainer,
} from '../../../dist/core/dev/index.js';
import { createFs, createRequestAndResponse, triggerFSEvent } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

function isStarted(container) {
	return !!container.viteServer.httpServer?.listening;
}

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

				`,
			},
			root
		);

		const restart = await createContainerWithAutomaticRestart({
			fs,
			inlineConfig: { root: fileURLToPath(root), logLevel: 'silent' },
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
			restart.container.viteServer.watcher.emit(
				'change',
				fs.getFullyResolvedPath('/astro.config.mjs')
			);

			// Wait for the restart to finish
			let hmrError = await restartComplete;
			expect(hmrError).to.not.be.a('undefined');

			// Do it a second time to make sure we are still watching

			restartComplete = restart.restarted();
			fs.writeFileFromRootSync('/astro.config.mjs', 'const foo = bar2');

			// Vite watches the real filesystem, so we have to mock this part. It's not so bad.
			restart.container.viteServer.watcher.emit(
				'change',
				fs.getFullyResolvedPath('/astro.config.mjs')
			);

			hmrError = await restartComplete;
			expect(hmrError).to.not.be.a('undefined');
		} finally {
			await restart.container.close();
		}
	});

	it('Restarts the container if previously started', async () => {
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
				'/astro.config.mjs': ``,
			},
			root
		);

		const restart = await createContainerWithAutomaticRestart({
			fs,
			inlineConfig: { root: fileURLToPath(root), logLevel: 'silent' },
		});
		await startContainer(restart.container);
		expect(isStarted(restart.container)).to.equal(true);

		try {
			// Trigger a change
			let restartComplete = restart.restarted();
			triggerFSEvent(restart.container, fs, '/astro.config.mjs', 'change');
			await restartComplete;

			expect(isStarted(restart.container)).to.equal(true);
		} finally {
			await restart.container.close();
		}
	});

	it('Is able to restart project using Tailwind + astro.config.ts', async () => {
		const troot = new URL('../../fixtures/tailwindcss-ts/', import.meta.url);
		const fs = createFs(
			{
				'/src/pages/index.astro': ``,
				'/astro.config.ts': ``,
			},
			troot
		);

		const restart = await createContainerWithAutomaticRestart({
			fs,
			inlineConfig: { root: fileURLToPath(root), logLevel: 'silent' },
		});
		await startContainer(restart.container);
		expect(isStarted(restart.container)).to.equal(true);

		try {
			// Trigger a change
			let restartComplete = restart.restarted();
			triggerFSEvent(restart.container, fs, '/astro.config.ts', 'change');
			await restartComplete;

			expect(isStarted(restart.container)).to.equal(true);
		} finally {
			await restart.container.close();
		}
	});

	it('Is able to restart project on package.json changes', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': ``,
			},
			root
		);

		const restart = await createContainerWithAutomaticRestart({
			fs,
			inlineConfig: { root: fileURLToPath(root), logLevel: 'silent' },
		});
		await startContainer(restart.container);
		expect(isStarted(restart.container)).to.equal(true);

		try {
			let restartComplete = restart.restarted();
			fs.writeFileSync('/package.json', `{}`);
			triggerFSEvent(restart.container, fs, '/package.json', 'change');
			await restartComplete;
		} finally {
			await restart.container.close();
		}
	});

	it('Is able to restart on viteServer.restart API call', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': ``,
			},
			root
		);

		const restart = await createContainerWithAutomaticRestart({
			fs,
			inlineConfig: { root: fileURLToPath(root), logLevel: 'silent' },
		});
		await startContainer(restart.container);
		expect(isStarted(restart.container)).to.equal(true);

		try {
			let restartComplete = restart.restarted();
			await restart.container.viteServer.restart();
			await restartComplete;
		} finally {
			await restart.container.close();
		}
	});
});
