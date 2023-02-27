import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import autocannon from 'autocannon';
import { execaCommand } from 'execa';
import { waitUntilBusy } from 'port-authority';

const astro = fileURLToPath(new URL('../packages/astro/astro.js', import.meta.url));
const port = 4321;

export const defaultProject = 'server-stress-default';

/**
 * @param {URL} projectDir
 * @param {URL} outputFile
 * @param {string} [title]
 */
export async function run(projectDir, outputFile, title) {
	const root = fileURLToPath(projectDir);

	console.log('Building...');
	await execaCommand(`${astro} build`, {
		cwd: root,
		stdio: 'inherit',
	});

	console.log('Previewing...');
	const previewProcess = execaCommand(`${astro} preview --port ${port}`, {
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
	if (title) console.log(`#### Server stress (${title})\n`);
	console.log(autocannon.printResult(result));
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
					if (process.env.CI) {
						result = result.match(/^.*?requests in.*?read$/m)?.[0];
					}
					resolve(result);
				}
			}
		);
		autocannon.track(instance, { renderResultsTable: false });
	});
}
