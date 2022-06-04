// @ts-check
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

export * from '../../../astro/test/test-utils.js';

/**
 * @typedef {Object} ServerController
 * @property {() => Promise<void>} done
 */

/**
 * Wrangler development server
 * Reference https://github.com/cloudflare/wrangler2/blob/08e3a49985520fc7931f2823c198345ddf956a2f/examples/local-mode-tests/tests/helpers.ts
 *
 * @param {URL} dir URL to fixture output directory
 * @param {URL} site URL to dev server
 * @param {array} args Wrangler arguments to append
 * @returns {Promise<ServerController>}
 */
export async function server(dir, site, args = []) {
	const { port } = site;

	if (!port) {
		throw Error(`{site} URL is missing {port}`);
	}

	const wrangler = spawn(
		'npx',
		['wrangler', 'pages', 'dev', fileURLToPath(dir), '--port', port, '--local'].concat(args),
		{ stdio: 'pipe' }
	);

	const done = () => {
		return new Promise((res, rej) => {
			wrangler.on('exit', (code) => {
				if (!code) {
					res();
				} else {
					rej(code);
				}
			});
			wrangler.kill();
		});
	};

	const MAX_ATTEMPTS = 50;
	const SLEEP_MS = 100;

	let attempts = MAX_ATTEMPTS;

	while (0 < attempts--) {
		await sleep(SLEEP_MS);

		try {
			await fetch(`http://localhost:${port}`, { method: 'HEAD' });
			return { done };
		} catch {}
	}

	await done();
	throw Error(`Unable to start wrangler dev server`);
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
async function sleep(ms) {
	await new Promise((res) => setTimeout(res, ms));
}
