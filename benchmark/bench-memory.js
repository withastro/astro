import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { execaCommand } from 'execa';
import { markdownTable } from 'markdown-table';

/** @typedef {Record<string, import('../packages/astro/src/core/config/timer').Stat>} AstroTimerStat */

const astro = fileURLToPath(new URL('../packages/astro/astro.js', import.meta.url));

/** Default project to run for this benchmark if not specified */
export const defaultProject = 'memory-default';

/**
 * @param {URL} projectDir
 * @param {URL} outputFile
 */
export async function run(projectDir, outputFile) {
	const root = fileURLToPath(projectDir);
	const outputFilePath = fileURLToPath(outputFile);

	console.log('Building and benchmarking...');
	await execaCommand(`${astro} build`, {
		cwd: root,
		stdio: 'inherit',
		env: {
			ASTRO_TIMER_PATH: outputFilePath,
		},
	});

	console.log('Raw results written to', outputFilePath);

	console.log('Result preview:');
	console.log(printResult(JSON.parse(await fs.readFile(outputFilePath, 'utf-8'))));

	console.log('Done!');
}

/**
 * @param {{ name: string, output: AstroTimerStat}} resultA
 * @param {{ name: string, output: AstroTimerStat}} resultB
 */
export async function compare(resultA, resultB) {
	return `\
### ${resultA.name}

${printResult(resultA.output)}

### ${resultB.name}

${printResult(resultB.output)}`;
}

/**
 * @param {AstroTimerStat} output
 */
function printResult(output) {
	return markdownTable([
		['', 'Elapsed time (s)', 'Memory used (MB)', 'Final memory (MB)'],
		...Object.entries(output).map(([name, stat]) => [
			name,
			Math.round(stat.elapsedTime),
			Math.round(stat.heapUsedChange / 1024 / 1024),
			Math.round(stat.heapUsedTotal / 1024 / 1024),
		]),
	]);
}
