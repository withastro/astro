import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import kill from 'kill-port';
import { loadFixture as baseLoadFixture } from '../../../astro/test/test-utils.js';

export { fixLineEndings } from '../../../astro/test/test-utils.js';

/**
 * @typedef {{ ready: Promise<void>, stop: Promise<void> }} WranglerCLI
 * @typedef {import('../../../astro/test/test-utils').Fixture} Fixture
 */

export function loadFixture(config) {
	if (config?.root) {
		config.root = new URL(config.root, import.meta.url);
	}
	return baseLoadFixture(config);
}

const wranglerPath = fileURLToPath(
	new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)
);

/**
 * @returns {Promise<WranglerCLI>}
 */
export async function runCLI(basePath, { silent, port }) {
	// Hack: force existing process on port to be killed
	try {
		await kill(port, 'tcp');
	} catch {
		// Will throw if port is not in use, but that's fine
	}

	const script = fileURLToPath(new URL(`${basePath}/dist/_worker.js`, import.meta.url));
	const p = spawn('node', [
		wranglerPath,
		'dev',
		script,
		'--port',
		port,
		'--log-level',
		'info',
		'--persist-to',
		`${basePath}/.wrangler/state`,
	]);

	p.stderr.setEncoding('utf-8');
	p.stdout.setEncoding('utf-8');

	const timeout = 20_000;

	const ready = new Promise(async (resolve, reject) => {
		const failed = setTimeout(() => {
			p.kill();
			reject(new Error(`Timed out starting the wrangler CLI`));
		}, timeout);

		(async function () {
			for (const msg of p.stderr) {
				if (!silent) {
					console.error(msg);
				}
			}
		})();

		for await (const msg of p.stdout) {
			if (!silent) {
				console.log(msg);
			}
			if (msg.includes(`[mf:inf] Ready on`)) {
				break;
			}
		}

		clearTimeout(failed);
		resolve();
	});

	return {
		ready,
		stop() {
			return new Promise((resolve, reject) => {
				p.on('close', () => resolve());
				p.on('error', (err) => reject(err));
				p.kill();
			});
		},
	};
}
