import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { markdownTable } from 'markdown-table';
import { astroBin, calculateStat } from './_util.js';

/** Default project to run for this benchmark if not specified */
export const defaultProject = 'dev-startup';

const READY_TIMEOUT_MS = 30_000;
const URL_TIMEOUT_MS = 2_000;
const STOP_TIMEOUT_MS = 5_000;

const URL_REGEX = /http:\/\/(?:127\.0\.0\.1|localhost):\d+/;

/**
 * Start `astro dev` on `root` and wait until the server prints its ready
 * message. `--port 0` lets Vite pick a free port, so concurrent benchmark runs
 * (parallel CI shards, multiple worktrees) never collide.
 *
 * Measures two spans from the same start time: `readyMs` (process spawn until
 * the "ready in" message) and `firstResponseMs` (spawn until `/` answers 200).
 * The server is fully stopped and its lock file removed before returning, so
 * consecutive runs never race a dying server.
 *
 * @param {string} root
 * @param {{ fetchOnReady?: boolean }} [options] When false, skip the first
 * request and stop the server right after it becomes ready.
 * @returns {Promise<{ readyMs: number, firstResponseMs: number, url: string }>}
 */
export async function measureDevStartup(root, { fetchOnReady = true } = {}) {
	const start = performance.now();

	const env = { ...process.env };
	// Strip vitest's worker env: Astro's dev server plugin skips all request
	// middleware when `process.env.VITEST` is set, which would leave the
	// spawned server unable to answer requests.
	for (const key of Object.keys(env)) {
		if (key.startsWith('VITEST')) {
			delete env[key];
		}
	}
	env.CI = 'true';
	env.ASTRO_TELEMETRY_DISABLED = '1';
	env.NO_COLOR = '1';
	env.NODE_ENV = 'development';

	const child = spawn('node', [astroBin, 'dev', '--port', '0', '--host', '127.0.0.1'], {
		cwd: root,
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
	});

	let output = '';
	let stderr = '';
	let readyMs;
	let firstResponseMs;
	let url;

	try {
		// Resolve at the "ready in" message, reject on early exit or timeout.
		const ready = new Promise((resolve, reject) => {
			let timedOut = false;
			const timer = setTimeout(() => {
				timedOut = true;
				reject(new Error(`astro dev did not become ready within ${READY_TIMEOUT_MS}ms`));
			}, READY_TIMEOUT_MS);

			child.stdout.on('data', (chunk) => {
				output += chunk;
				if (readyMs === undefined && output.includes('ready in')) {
					readyMs = performance.now() - start;
					clearTimeout(timer);
					resolve();
				}
			});
			child.stderr.on('data', (chunk) => {
				stderr += chunk;
			});
			child.on('exit', (code) => {
				if (!timedOut && readyMs === undefined) {
					clearTimeout(timer);
					reject(
						new Error(
							`astro dev exited before becoming ready (code ${code}).\nstdout: ${output}\nstderr: ${stderr}`,
						),
					);
				}
			});
			child.on('error', (error) => {
				clearTimeout(timer);
				reject(new Error(`Failed to spawn astro dev: ${error.message}`));
			});
		});

		await ready;

		// The "Local" URL line is printed right after the ready message; poll
		// briefly in case the two lines arrive in different chunks.
		url = URL_REGEX.exec(output)?.[0];
		if (!url && fetchOnReady) {
			const deadline = performance.now() + URL_TIMEOUT_MS;
			while (performance.now() < deadline) {
				await new Promise((resolve) => setTimeout(resolve, 20));
				url = URL_REGEX.exec(output)?.[0];
				if (url) break;
			}
		}

		if (url && fetchOnReady) {
			const res = await fetch(url);
			if (!res.ok) {
				throw new Error(`First request to ${url} failed with status ${res.status}`);
			}
			firstResponseMs = performance.now() - start;
		}
	} finally {
		await stopDevServer(child, root);
	}

	return { readyMs, firstResponseMs, url };
}

/**
 * SIGTERM the dev server and wait for it to exit, escalating to SIGKILL after
 * {@link STOP_TIMEOUT_MS}. Removes the `.astro/dev.json` lock file so the next
 * run does not trip the "already running" check.
 *
 * @param {import('node:child_process').ChildProcess} child
 * @param {string} root
 */
async function stopDevServer(child, root) {
	if (child.exitCode !== null || child.signalCode !== null) {
		return;
	}

	const exited = new Promise((resolve) => {
		child.on('exit', resolve);
	});
	child.kill('SIGTERM');

	await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, STOP_TIMEOUT_MS))]);

	if (child.exitCode === null && child.signalCode === null) {
		child.kill('SIGKILL');
		await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, STOP_TIMEOUT_MS))]);
	}

	await fs.rm(new URL('.astro/dev.json', new URL(`file://${root}/`)), { force: true });
}

/**
 * @param {URL} projectDir
 * @param {URL} outputFile
 */
export async function run(projectDir, outputFile) {
	const root = fileURLToPath(projectDir);

	// First run warms the project: OS file caches, `.astro` types, the content
	// data store and Vite's dep optimizer cache. Measure the steady state that
	// a developer hitting `astro dev` on a project they already ran sees.
	console.log('Warming up...');
	await measureDevStartup(root);

	const ready = [];
	const firstResponse = [];

	for (let i = 0; i < 10; i++) {
		const result = await measureDevStartup(root);
		ready.push(result.readyMs);
		if (result.firstResponseMs !== undefined) {
			firstResponse.push(result.firstResponseMs);
		}
	}

	const readyStat = calculateStat(ready);
	const firstResponseStat = calculateStat(firstResponse);

	await fs.writeFile(
		outputFile,
		JSON.stringify(
			{
				benchmark: 'dev-startup',
				timeToReadyMs: ready,
				timeToFirstResponseMs: firstResponse,
				readyStat,
				firstResponseStat,
			},
			null,
			2,
		),
	);

	console.log('Raw results written to', fileURLToPath(outputFile));

	console.log('Result preview:');
	console.log('='.repeat(10));
	console.log(`#### Dev server startup\n\n`);
	console.log(
		printResult({
			'Time to ready': readyStat,
			'Time to first response (200)': firstResponseStat,
		}),
	);
	console.log('='.repeat(10));

	console.log('Done!');
}

/**
 * @param {Record<string, import('./_util.js').Stat>} result
 */
function printResult(result) {
	return markdownTable(
		[
			['', 'Avg (ms)', 'Stdev (ms)', 'Max (ms)'],
			...Object.entries(result).map(([name, { avg, stdev, max }]) => [
				name,
				avg.toFixed(2),
				stdev.toFixed(2),
				max.toFixed(2),
			]),
		],
		{
			align: ['l', 'r', 'r', 'r'],
		},
	);
}
