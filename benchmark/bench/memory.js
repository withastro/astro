import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { markdownTable } from 'markdown-table';
import { exec } from 'tinyexec';
import { astroBin } from './_util.js';

/** @typedef {Record<string, import('../../packages/astro/src/core/config/timer').Stat>} AstroTimerStat */

/** Default project to run for this benchmark if not specified */
export const defaultProject = 'memory-default';

/**
 * @param {URL} projectDir
 * @param {URL} outputFile
 */
export async function run(projectDir, outputFile) {
	const root = fileURLToPath(projectDir);
	const outputFilePath = fileURLToPath(outputFile);

	console.info('Building and benchmarking...');
	await exec('node', ['--expose-gc', '--max_old_space_size=10000', astroBin, 'build'], {
		nodeOptions: {
			cwd: root,
			stdio: 'inherit',
			env: {
				ASTRO_TIMER_PATH: outputFilePath,
			},
		},
		throwOnError: true,
	});

	console.info('Raw results written to', outputFilePath);

	console.info('Result preview:');
	console.info('='.repeat(10));
	console.info(`#### Memory\n\n`);
	console.info(printResult(JSON.parse(await fs.readFile(outputFilePath, 'utf-8'))));
	console.info('='.repeat(10));

	console.info('Done!');
}

/**
 * @param {AstroTimerStat} output
 */
function printResult(output) {
	return markdownTable(
		[
			['', 'Elapsed time (s)', 'Memory used (MB)', 'Final memory (MB)'],
			...Object.entries(output).map(([name, stat]) => [
				name,
				(stat.elapsedTime / 1000).toFixed(2),
				(stat.heapUsedChange / 1024 / 1024).toFixed(2),
				(stat.heapUsedTotal / 1024 / 1024).toFixed(2),
			]),
		],
		{
			align: ['l', 'r', 'r', 'r'],
		},
	);
}
