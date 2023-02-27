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
 */
export async function run(projectDir, outputFile) {
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
	console.log(autocannon.printResult(result));

	console.log('Done!');
}

/**
 * @param {{ name: string, output: import('autocannon').Result}} resultA
 * @param {{ name: string, output: import('autocannon').Result}} resultB
 */
export async function compare(resultA, resultB) {
	const resultRegex = /Req\/Bytes.*read/s;
	const textA = autocannon.printResult(resultA.output).match(resultRegex)?.[0];
	const textB = autocannon.printResult(resultB.output).match(resultRegex)?.[0];

	return `\
### ${resultA.name}

${textA}

### ${resultB.name}

${textB}`;
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
		autocannon.track(instance);
	});
}
