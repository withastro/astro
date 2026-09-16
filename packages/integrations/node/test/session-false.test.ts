import assert from 'node:assert/strict';
import { resolve, sep } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import nodejs from '../dist/index.js';

async function runConfigSetup(session: unknown) {
	const root = pathToFileURL(resolve('/project') + sep);
	const logs: string[] = [];
	let updated: any;

	const integration = nodejs({ mode: 'standalone' });
	await (integration.hooks['astro:config:setup'] as any)({
		command: 'build',
		config: {
			root,
			session,
			cacheDir: new URL('./.astro/', root),
			outDir: new URL('./dist/', root),
			srcDir: new URL('./src/', root),
			image: { endpoint: { route: undefined, entrypoint: undefined } },
			build: { client: new URL('./dist/client/', root), server: new URL('./dist/server/', root) },
			server: { host: false, port: 4321 },
		},
		logger: {
			info: (message: string) => logs.push(message),
			warn: () => {},
			error: () => {},
			debug: () => {},
		},
		updateConfig: (config: any) => {
			updated = config;
			return config;
		},
		addWatchFile: () => {},
	});

	return { session: updated?.session, logs };
}

describe('@astrojs/node session: false', () => {
	it('wires no session driver when sessions are disabled', async () => {
		const { session, logs } = await runConfigSetup(false);
		assert.equal(session, false, 'the adapter should leave `session: false` untouched');
		assert.equal(
			logs.some((message) => message.includes('Enabling sessions')),
			false,
			'the adapter should not announce that it enabled sessions',
		);
	});

	it('does not override a driver the user configured', async () => {
		const { session, logs } = await runConfigSetup({ driver: { entrypoint: 'custom-driver' } });
		assert.deepEqual(session?.driver, { entrypoint: 'custom-driver' });
		assert.equal(
			logs.some((message) => message.includes('Enabling sessions')),
			false,
		);
	});

	it('still wires filesystem storage by default', async () => {
		const { session, logs } = await runConfigSetup(undefined);
		assert.ok(session?.driver, 'expected the default filesystem driver to be wired');
		assert.equal(
			logs.some((message) => message.includes('Enabling sessions with filesystem storage')),
			true,
		);
	});
});
