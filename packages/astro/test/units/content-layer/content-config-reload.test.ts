import assert from 'node:assert/strict';
import nodeFs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { createServer, type RunnableDevEnvironment, type ViteDevServer } from 'vite';
import { reloadContentConfigObserver } from '../../../dist/content/utils.js';
import { defaultLogger } from '../test-utils.ts';
import { createMinimalSettings, createTempDir } from './test-helpers.ts';

function createObserver() {
	let ctx: any = { status: 'init' };
	return {
		get: () => ctx,
		set: (next: any) => {
			ctx = next;
		},
		subscribe: () => () => {},
	};
}

function configSource(version: number) {
	return `export const collections = { theme: { type: 'data', schema: { version: ${version} } } };\n`;
}

describe('reloadContentConfigObserver', () => {
	const root = createTempDir();
	const configUrl = new URL('./src/content.config.mjs', root);
	let server: ViteDevServer;

	before(async () => {
		nodeFs.mkdirSync(new URL('./src/', root), { recursive: true });
		nodeFs.writeFileSync(configUrl, configSource(1));
		// File watching is disabled so Vite never invalidates the config module on its own,
		// as when a data file change triggers a reload before Vite processes the config change.
		server = await createServer({
			root: root.pathname,
			configFile: false,
			logLevel: 'silent',
			appType: 'custom',
			server: { middlewareMode: true, watch: null, ws: false },
		});
	});

	after(async () => {
		await server.close();
		nodeFs.rmSync(root, { recursive: true, force: true });
	});

	it('evaluates the config file version that its digest describes', async () => {
		const settings = createMinimalSettings(root);
		const observer = createObserver();
		const load = async () => {
			await reloadContentConfigObserver({
				fs: nodeFs,
				settings,
				environment: server.environments.ssr as RunnableDevEnvironment,
				logger: defaultLogger,
				observer: observer as any,
			});
			const ctx = observer.get();
			assert.equal(ctx.status, 'loaded');
			return ctx.config;
		};

		const first = await load();
		assert.deepEqual(first.collections.theme.schema, { version: 1 });

		nodeFs.writeFileSync(configUrl, configSource(2));
		const second = await load();
		assert.notEqual(second.digest, first.digest);
		assert.deepEqual(second.collections.theme.schema, { version: 2 });
	});
});
