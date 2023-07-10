import fs from 'fs/promises';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { execaCommand } from 'execa';
import { waitUntilBusy } from 'port-authority';
import { markdownTable } from 'markdown-table';
import { renderFiles } from '../make-project/render-default.js';
import { calculateStat } from '../make-project/_util.js';
import { astroBin } from './_util.js';

const port = 4322;

export const defaultProject = 'render-default';

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
	const result = await benchmarkRenderTime();

	console.log('Killing server...');
	if (!previewProcess.kill('SIGTERM')) {
		console.warn('Failed to kill server process id:', previewProcess.pid);
	}

	console.log('Writing results to', fileURLToPath(outputFile));
	await fs.writeFile(outputFile, JSON.stringify(result, null, 2));

	console.log('Result preview:');
	console.log('='.repeat(10));
	console.log(`#### Render\n\n`);
	console.log(printResult(result));
	console.log('='.repeat(10));

	console.log('Done!');
}

async function benchmarkRenderTime() {
	/** @type {Record<string, number[]>} */
	const result = {};
	for (const fileName of Object.keys(renderFiles)) {
		// Render each file 100 times and push to an array
		for (let i = 0; i < 100; i++) {
			const pathname = '/' + fileName.slice(0, -path.extname(fileName).length);
			const renderTime = await fetchRenderTime(`http://localhost:${port}${pathname}`);
			if (!result[pathname]) result[pathname] = [];
			result[pathname].push(renderTime);
		}
	}
	/** @type {Record<string, import('./_util.js').Stat>} */
	const processedResult = {};
	for (const [pathname, times] of Object.entries(result)) {
		// From the 100 results, calculate average, standard deviation, and max value
		processedResult[pathname] = calculateStat(times);
	}
	return processedResult;
}

/**
 * @param {Record<string, import('./_util.js').Stat>} result
 */
function printResult(result) {
	return markdownTable(
		[
			['Page', 'Avg (ms)', 'Stdev (ms)', 'Max (ms)'],
			...Object.entries(result).map(([pathname, { avg, stdev, max }]) => [
				pathname,
				avg.toFixed(2),
				stdev.toFixed(2),
				max.toFixed(2),
			]),
		],
		{
			align: ['l', 'r', 'r', 'r'],
		}
	);
}

/**
 * Simple fetch utility to get the render time sent by `@benchmark/timer` in plain text
 * @param {string} url
 * @returns {Promise<number>}
 */
function fetchRenderTime(url) {
	return new Promise((resolve, reject) => {
		const req = http.request(url, (res) => {
			res.setEncoding('utf8');
			let data = '';
			res.on('data', (chunk) => (data += chunk));
			res.on('error', (e) => reject(e));
			res.on('end', () => resolve(+data));
		});
		req.on('error', (e) => reject(e));
		req.end();
	});
}
