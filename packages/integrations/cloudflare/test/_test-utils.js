import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import { loadFixture as baseLoadFixture } from '../../../astro/test/test-utils.js';

/**
 * @typedef {{ stop: Promise<void>, port: number }} WranglerCLI
 */

const astroPath = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
/** Returns a process running the Astro CLI. */
export function astroCli(cwd, /** @type {string[]} */ ...args) {
	const spawned = execa(astroPath, [...args], {
		env: { ASTRO_TELEMETRY_DISABLED: true },
		cwd: cwd,
	});

	spawned.stdout.setEncoding('utf8');

	return spawned;
}

const wranglerPath = fileURLToPath(
	new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url),
);

/** Returns a process running the Wrangler CLI. */
export function wranglerCli(cwd) {
	const spawned = execa(
		wranglerPath,
		[
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
			env: { CI: 1, CF_PAGES: 1 },
			cwd: cwd,
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
