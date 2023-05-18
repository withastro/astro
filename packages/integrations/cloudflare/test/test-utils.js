import { loadFixture as baseLoadFixture } from '../../../astro/test/test-utils.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

export { fixLineEndings } from '../../../astro/test/test-utils.js';

/**
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

export function runCLI(basePath, { silent }) {
	const script = fileURLToPath(new URL(`${basePath}/dist/_worker.js`, import.meta.url));
	const p = spawn('node', [wranglerPath, 'dev', '-l', script]);

	p.stderr.setEncoding('utf-8');
	p.stdout.setEncoding('utf-8');

	const timeout = 10000;

	const ready = new Promise(async (resolve, reject) => {
		const failed = setTimeout(
			() => reject(new Error(`Timed out starting the wrangler CLI`)),
			timeout
		);

		(async function () {
			for (const msg of p.stderr) {
				if (!silent) {
					// eslint-disable-next-line
					console.error(msg);
				}
			}
		})();

		for await (const msg of p.stdout) {
			if (!silent) {
				// eslint-disable-next-line
				console.log(msg);
			}
			if (msg.includes(`Listening on`)) {
				break;
			}
		}

		clearTimeout(failed);
		resolve();
	});

	return {
		ready,
		stop() {
			p.kill();
		},
	};
}

const workerdPath = fileURLToPath(new URL('../node_modules/workerd/bin/workerd', import.meta.url));

export function runWorkerd(basePath, { silent }) {
	const configPath = fileURLToPath(new URL(`${basePath}/config.capnp`, import.meta.url));
	const distPath = fileURLToPath(new URL(`${basePath}/dist`, import.meta.url));

	const p = spawn(workerdPath, ['serve', configPath, '--verbose', '--directory-path', `site-files=${distPath}`]);
	p.stderr.setEncoding('utf-8');
	p.stdout.setEncoding('utf-8');
	const pwd = process.cwd();
	console.log(pwd);
	const timeout = 10000;

	const ready = new Promise(async (resolve, reject) => {
		const failed = setTimeout(
			() => reject(new Error(`Timed out starting workerd`)),
			timeout
		);

		p.stderr.on('data', (data) => {
			if (!silent) {
				// eslint-disable-next-line
				console.error(data);
				reject(data)
			}
		});

		setTimeout(() => {
			clearTimeout(failed);
			resolve();
		}, 1000);
	});

	return {
		ready,
		stop() {
			p.kill();
		},
	};
}
