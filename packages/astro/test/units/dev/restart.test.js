import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

import {
	createContainerWithAutomaticRestart,
	isStarted,
	startContainer,
} from '../../../dist/core/dev/index.js';
import {
	createFs,
	createRequestAndResponse,
	defaultLogging,
	triggerFSEvent,
} from '../test-utils.js';
import { createSettings, openConfig } from '../../../dist/core/config/index.js';

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
				
				`,
			},
			root
		);

		let restart = await createContainerWithAutomaticRestart({
			params: { fs, root },
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

		let restart = await createContainerWithAutomaticRestart({
			params: { fs, root },
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

		const { astroConfig } = await openConfig({
			cwd: troot,
			flags: {},
			cmd: 'dev',
			logging: defaultLogging,
		});
		const settings = createSettings(astroConfig);

		let restart = await createContainerWithAutomaticRestart({
			params: { fs, root, settings },
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

		const { astroConfig } = await openConfig({
			cwd: root,
			flags: {},
			cmd: 'dev',
			logging: defaultLogging,
		});
		const settings = createSettings(astroConfig, fileURLToPath(root));

		let restart = await createContainerWithAutomaticRestart({
			params: { fs, root, settings },
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

		const { astroConfig } = await openConfig({
			cwd: root,
			flags: {},
			cmd: 'dev',
			logging: defaultLogging,
		});
		const settings = createSettings(astroConfig, fileURLToPath(root));

		let restart = await createContainerWithAutomaticRestart({
			params: { fs, root, settings },
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
