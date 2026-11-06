import assert from 'node:assert/strict';
import { it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createContainerWithAutomaticRestart, startContainer } from '../dist/core/dev/index.js';

const root = new URL('./fixtures/dev-container/', import.meta.url);

it('releases replaced graphs without clearing environments kept after a failed restart', {
	timeout: 20000,
}, async (t) => {
	const initialListeners = process.listenerCount('unhandledRejection');
	const restart = await createContainerWithAutomaticRestart({
		inlineConfig: {
			root: fileURLToPath(root),
			logLevel: 'silent',
			devToolbar: { enabled: false },
			server: { port: 0 },
		},
	});
	const server = restart.container.viteServer;
	t.after(async () => {
		await restart.container.close();
		assert.equal(process.listenerCount('unhandledRejection'), initialListeners);
	});
	const address = await startContainer(restart.container);
	const request = async () => {
		const response = await fetch(`http://localhost:${address.port}/`);
		assert.equal(response.status, 200);
		assert.match(await response.text(), /Testing/);
	};
	const restartConfig = async () => {
		const complete = restart.restarted();
		server.watcher.emit('change', fileURLToPath(new URL('astro.config.mjs', root)));
		assert.equal(await complete, null);
	};

	await request();
	for (let i = 0; i < 2; i++) {
		const previous = server.environments;
		assert.ok(previous.ssr.moduleGraph.idToModuleMap.size > 0);
		await restartConfig();
		assert.equal(restart.container.viteServer, server);
		assert.notEqual(server.environments, previous);
		for (const environment of Object.values(previous)) {
			if (environment.mode !== 'dev') continue;
			const graph = environment.moduleGraph;
			assert.equal(graph.urlToModuleMap.size, 0);
			assert.equal(graph.idToModuleMap.size, 0);
			assert.equal(graph.etagToModuleMap.size, 0);
			assert.equal(graph.fileToModulesMap.size, 0);
			assert.equal((graph as any)._unresolvedUrlToModuleMap.size, 0);
		}
		await request();
		assert.equal(process.listenerCount('unhandledRejection'), initialListeners + 1);
	}

	const previous = server.environments;
	const modules = [...previous.ssr.moduleGraph.idToModuleMap];
	const unchangedRestart = t.mock.method(server, 'restart', async () => {});
	try {
		await restartConfig();
		assert.equal(server.environments, previous);
		assert.deepEqual([...previous.ssr.moduleGraph.idToModuleMap], modules);
		await request();
	} finally {
		unchangedRestart.mock.restore();
	}
});
