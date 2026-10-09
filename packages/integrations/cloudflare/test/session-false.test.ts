import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import cloudflare from '../dist/index.js';
import { cloudflareConfigCustomizer, DEFAULT_SESSION_KV_BINDING_NAME } from '../dist/wrangler.js';

let tempRoot: string;

before(() => {
	tempRoot = mkdtempSync(join(realpathSync(tmpdir()), 'astro-cloudflare-session-'));
});

after(() => {
	rmSync(tempRoot, { recursive: true, force: true });
});

async function runConfigSetup(session: unknown) {
	const root = pathToFileURL(`${tempRoot}/`);
	const logs: string[] = [];
	let updated: any;

	const integration = cloudflare();
	await (integration.hooks['astro:config:setup'] as any)({
		command: 'build',
		config: {
			root,
			session,
			srcDir: new URL('./src/', root),
			outDir: new URL('./dist/', root),
			cacheDir: new URL('./.astro/', root),
			build: { client: new URL('./dist/client/', root), server: new URL('./dist/server/', root) },
			experimental: { collectionStorage: 'single-file' },
			vite: {},
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

describe('@astrojs/cloudflare session: false', () => {
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

	it('still wires Cloudflare KV by default', async () => {
		const { session, logs } = await runConfigSetup(undefined);
		assert.ok(session?.driver, 'expected the default KV driver to be wired');
		assert.equal(
			logs.some((message) => message.includes('Enabling sessions with Cloudflare KV')),
			true,
		);
	});

	describe('KV binding resource', () => {
		const sessionBindings = (config: Record<string, any>) =>
			[...(config.kv_namespaces ?? []), ...(config.previews?.kv_namespaces ?? [])].filter(
				(kv) => kv.binding === DEFAULT_SESSION_KV_BINDING_NAME,
			);

		it('provisions no session KV namespace when the driver is not needed', () => {
			const customize = cloudflareConfigCustomizer({ needsSessionKVBinding: false });
			assert.deepEqual(sessionBindings(customize({})), []);
		});

		it('provisions the session KV namespace when the driver is needed', () => {
			const customize = cloudflareConfigCustomizer({ needsSessionKVBinding: true });
			assert.notEqual(
				sessionBindings(customize({})).length,
				0,
				'expected the session KV binding to be provisioned',
			);
		});
	});
});
