import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import netlifyIntegration from '../../dist/index.js';

let tempRoot: string;

before(() => {
	// The hook empties its function output directories, so it needs a real root.
	tempRoot = mkdtempSync(join(realpathSync(tmpdir()), 'astro-netlify-session-'));
});

after(() => {
	rmSync(tempRoot, { recursive: true, force: true });
});

async function runConfigSetup(session: unknown) {
	const root = pathToFileURL(`${tempRoot}/`);
	const logs: string[] = [];
	let updated: any;

	const integration = netlifyIntegration();
	await (integration.hooks['astro:config:setup'] as any)({
		command: 'build',
		config: {
			root,
			session,
			outDir: new URL('./dist/', root),
			srcDir: new URL('./src/', root),
			cacheDir: new URL('./.astro/', root),
			image: { domains: [], remotePatterns: [] },
			build: { client: new URL('./dist/client/', root), server: new URL('./dist/server/', root) },
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

describe('@astrojs/netlify session: false', () => {
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

	it('still wires Netlify Blobs by default', async () => {
		const { session, logs } = await runConfigSetup(undefined);
		assert.ok(session?.driver, 'expected the default Netlify Blobs driver to be wired');
		assert.equal(
			logs.some((message) => message.includes('Enabling sessions with Netlify Blobs')),
			true,
		);
	});
});
