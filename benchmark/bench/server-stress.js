import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import autocannon from 'autocannon';
import { execaCommand } from 'execa';
import { waitUntilBusy } from 'port-authority';
import { astroBin } from './_util.js';

const port = 4321;

export const defaultProject = 'server-stress-default';

/**
 * @param {URL} projectDir
 * @param {URL} outputFile
 */
export async function run(projectDir, outputFile) {
	const root = fileURLToPath(projectDir);

	console.log('Building...');
	await execaCommand(`${astroBin} build`, {
		cwd: root,
		stdio: 'inherit',
	});

	console.log('Previewing...');
	const previewProcess = execaCommand(`${astroBin} preview --port ${port}`, {
		cwd: root,
		stdio: 'inherit',
	});

	console.log('Waiting for server ready...');
	await waitUntilBusy(port, { timeout: 5000 });

	console.log('Running benchmark...');
	const result = await benchmarkCannon();

	console.log('Killing server...');
	if (!previewProcess.kill('SIGTERM')) {
		console.warn('Failed to kill server process id:', previewProcess.pid);
	}

	console.log('Writing results to', fileURLToPath(outputFile));
	await fs.writeFile(outputFile, JSON.stringify(result, null, 2));

	console.log('Result preview:');
	console.log('='.repeat(10));
	console.log(`#### Server stress\n\n`);
	let text = autocannon.printResult(result);
	// Truncate the logs in CI so that the generated comment from the `!bench` command
	// is shortened. Also we only need this information when comparing runs.
	// Full log example: https://github.com/mcollina/autocannon#command-line
	if (process.env.CI) {
		text = text.match(/^.*?requests in.*?read$/m)?.[0];
	}
	console.log(text);
	console.log('='.repeat(10));

	console.log('Done!');
}

/**
 * @returns {Promise<import('autocannon').Result>}
 */
async function benchmarkCannon() {
	return new Promise((resolve, reject) => {
		const instance = autocannon(
			{
				url: `http://localhost:${port}`,
				connections: 100,
				duration: 30,
				pipelining: 10,
			},
			(err, result) => {
				if (err) {
					reject(err);
				} else {
					// @ts-expect-error untyped but documented
					instance.stop();
					resolve(result);
				}
			}
		);
		autocannon.track(instance, { renderResultsTable: false });
	});
}
