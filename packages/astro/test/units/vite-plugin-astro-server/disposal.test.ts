import assert from 'node:assert/strict';
import { it } from 'node:test';
import { createRunnableDevEnvironment, createServer, type RunnableDevEnvironment } from 'vite';
import { devServerAppReadySymbol } from '../../../dist/core/constants.js';
import createVitePluginAstroServer from '../../../dist/vite-plugin-astro-server/plugin.js';
import { createBasicSettings, defaultLogger } from '../test-utils.ts';

it('disposes only the closing generation when server configurations overlap', async (t) => {
	const originalVitest = process.env.VITEST;
	delete process.env.VITEST;
	t.after(() => {
		if (originalVitest === undefined) delete process.env.VITEST;
		else process.env.VITEST = originalVitest;
	});

	const settings = await createBasicSettings({});
	const plugin = createVitePluginAstroServer({ settings, logger: defaultLogger });
	const initialListeners = process.listeners('unhandledRejection');
	const environments: RunnableDevEnvironment[] = [];
	const close = (environment: RunnableDevEnvironment) =>
		(plugin as any).closeBundle.call({ environment });
	t.after(() => environments.forEach(close));

	for (let i = 0; i < 2; i++) {
		const server = await createServer({
			configFile: false,
			logLevel: 'silent',
			server: { middlewareMode: true },
			environments: { ssr: { dev: { createEnvironment: createRunnableDevEnvironment } } },
		});
		t.after(() => server.close());
		const environment = server.environments.ssr as RunnableDevEnvironment;
		environments.push(environment);
		t.mock.method(environment.runner, 'import', async () => ({
			default: async () => ({ handler() {} }),
			manifest: {},
		}));
		await (plugin as any).configureServer(server);
		await (server as any)[devServerAppReadySymbol];
	}

	const listeners = process.listeners('unhandledRejection');
	assert.equal(listeners.length, initialListeners.length + 2);
	const replacementListener = listeners.at(-1)!;

	close(environments[0]);
	assert.deepEqual(process.listeners('unhandledRejection'), [
		...initialListeners,
		replacementListener,
	]);
	close(environments[0]);
	assert.equal(process.listenerCount('unhandledRejection'), initialListeners.length + 1);

	close(environments[1]);
	assert.deepEqual(process.listeners('unhandledRejection'), initialListeners);
});
