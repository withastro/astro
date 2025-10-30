import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadFixture as baseLoadFixture } from '../../../astro/test/test-utils.js';

/**
 * @typedef {{ stop: Promise<void>, port: number }} WranglerCLI
 */

const astroPath = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
/** Returns a process running the Astro CLI. */
export function astroCli(cwd, /** @type {string[]} */ ...args) {
	const proc = spawn('node', [astroPath, ...args], {
		env: { ...process.env, ASTRO_TELEMETRY_DISABLED: 'true' },
		cwd,
	});
	proc.stdout.setEncoding('utf-8');

	return {
		proc,
		getResult: () =>
			new Promise((resolve) => {
				let stdout = '';
				let stderr = '';
				proc.stdout.on('data', (chunk) => {
					stdout += chunk;
				});
				proc.stderr.on('data', (chunk) => {
					stderr += chunk;
				});
				proc.on('close', (exitCode) => {
					resolve({
						exitCode,
						stdout,
						stderr,
					});
				});
			}),
	};
}

const wranglerPath = fileURLToPath(
	new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url),
);

/** Returns a process running the Wrangler CLI. */
export function wranglerCli(cwd) {
	const spawned = spawn(
		'node',
		[
			wranglerPath,
			'pages',
			'dev',
			'dist',
			'--ip',
			'127.0.0.1',
			'--port',
			'8788',
			'--compatibility-date',
			new Date().toISOString().slice(0, 10),
			'--log-level',
			'info',
		],
		{
			env: {
				...process.env,
				CI: '1',
				CF_PAGES: '1',
			},
			cwd,
		},
	);

	spawned.stdout.setEncoding('utf8');
	spawned.stderr.setEncoding('utf8');

	return spawned;
}

/**
 * @typedef {import('../../../astro/test/test-utils').Fixture} Fixture
 */
export function loadFixture(inlineConfig) {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root, import.meta.url).toString(),
	});
}
