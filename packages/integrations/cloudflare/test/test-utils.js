import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadFixture as baseLoadFixture } from '../../../astro/test/test-utils.js';
import * as net from 'node:net';
export { fixLineEndings } from '../../../astro/test/test-utils.js';
/**
 * @typedef {{ stop: Promise<void>, port: number }} WranglerCLI
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

let lastPort = 8788;

/**
 * @returns {Promise<WranglerCLI>}
 */
export async function runCLI(
	basePath,
	{
		silent,
		maxAttempts = 3,
		timeoutMillis = 2500, // really short because it often seems to just hang on the first try, but work subsequently, no matter the wait
		backoffFactor = 2, // | - 2.5s -- 5s ---- 10s -> onTimeout
		onTimeout = (ex) => {
			new Error(`Timed out starting the wrangler CLI after ${maxAttempts} tries.`, { cause: ex });
		},
	}
) {
	let triesRemaining = maxAttempts;
	let timeout = timeoutMillis;
	let cli;
	let lastErr;
	while (triesRemaining > 0) {
		cli = await tryRunCLI(basePath, { silent, timeout, forceRotatePort: triesRemaining !== maxAttempts });
		try {
			await cli.ready;
			return cli;
		} catch (err) {
			lastErr = err;
			console.error((err.message || err.name || err) + ' after ' + timeout + 'ms');
			cli.stop();
			triesRemaining -= 1;
			timeout *= backoffFactor;
		}
	}
	onTimeout(lastErr);
	return cli;
}

async function tryRunCLI(basePath, { silent, timeout, forceRotatePort = false }) {
	const port = await getNextOpenPort(lastPort + (forceRotatePort ? 1 : 0));
	lastPort = port;

	const fixtureDir = fileURLToPath(new URL(`${basePath}`, import.meta.url));
	const p = spawn(
		'node',
		[
			wranglerPath,
			'pages',
			'dev',
			'dist',
			'--port',
			port,
			'--log-level',
			'info',
			'--persist-to',
			'.wrangler/state',
		],
		{
			cwd: fixtureDir,
		}
	);

	p.stderr.setEncoding('utf-8');
	p.stdout.setEncoding('utf-8');

	const ready = new Promise(async (resolve, reject) => {
		const failed = setTimeout(() => {
			p.kill('SIGKILL');
			reject(new Error(`Timed out starting the wrangler CLI`));
		}, timeout);

		const success = () => {
			clearTimeout(failed);
			resolve();
		};

		p.on('exit', (code) => reject(`wrangler terminated unexpectedly with exit code ${code}`));

		p.stderr.on('data', (data) => {
			if (!silent) {
				process.stdout.write(data);
			}
		});
		let allData = '';
		p.stdout.on('data', (data) => {
			if (!silent) {
				process.stdout.write(data);
			}
			allData += data;
			if (allData.includes(`[mf:inf] Ready on`)) {
				success();
			}
		});
	});

	return {
		port,
		ready,
		stop() {
			return new Promise((resolve, reject) => {
				const timer = setTimeout(() => {
					p.kill('SIGKILL');
				}, 1000);
				p.on('close', () => {
					clearTimeout(timer);
					resolve();
				});
				p.on('error', (err) => reject(err));
				p.kill();
			});
		},
	};
}

const isPortOpen = async (port) => {
	return new Promise((resolve, reject) => {
		let s = net.createServer();
		s.once('error', (err) => {
			s.close();
			if (err['code'] == 'EADDRINUSE') {
				resolve(false);
			} else {
				reject(err);
			}
		});
		s.once('listening', () => {
			resolve(true);
			s.close();
		});
		s.listen(port, "0.0.0.0");
	});
};

const getNextOpenPort = async (startFrom) => {
	let openPort = null;
	while (startFrom < 65535 || !!openPort) {
		if (await isPortOpen(startFrom)) {
			openPort = startFrom;
			break;
		}
		startFrom++;
	}
	return openPort;
};
