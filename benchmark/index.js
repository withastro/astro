import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import mri from 'mri';
import { makeProject } from './make-project.js';

/**
 * astro-benchmark [command] [options]
 *
 * Options:
 * --project <project-name>
 * --output <output-file>
 * --compare <output-file-a>,<output-file-b>
 *
 * Examples:
 * ```bash
 * # Run all benchmarks
 * astro-benchmark
 * ```
 */

const args = mri(process.argv.slice(2));

const commandName = args._[0];
const benchmarks = {
	memory: () => import('./bench-memory.js'),
	'server-stress': () => import('./bench-server-stress.js'),
};

if (commandName && !(commandName in benchmarks)) {
	console.error(`Invalid benchmark name: ${commandName}`);
	process.exit(1);
}

// If we're running a compare command, run it and exit
if (args.compare) {
	const [outputA, outputB] = args.compare.split(',').map((s) => s.trim());
	if (!outputA || !outputB) {
		console.error(
			`Invalid --compare value: ${args.compare}, must have two files, separated by a comma.`
		);
		process.exit(1);
	}
	const bench = benchmarks[commandName];
	const benchMod = await bench();
	const result = await benchMod.compare(
		{
			name: path.basename(outputA, '.json'),
			output: JSON.parse(await fs.readFile(path.resolve(outputA), 'utf-8')),
		},
		{
			name: path.basename(outputB, '.json'),
			output: JSON.parse(await fs.readFile(path.resolve(outputB), 'utf-8')),
		}
	);
	console.log(result);
	process.exit(0);
}

if (commandName) {
	// Run single benchmark
	const bench = benchmarks[commandName];
	const benchMod = await bench();
	const projectDir = await makeProject(args.project || benchMod.defaultProject);
	const outputFile = await getOutputFile(commandName);
	await benchMod.run(projectDir, outputFile);
} else {
	// Run all benchmarks
	for (const name in benchmarks) {
		const bench = benchmarks[name];
		const benchMod = await bench();
		const projectDir = await makeProject(args.project || benchMod.defaultProject);
		const outputFile = await getOutputFile(name);
		await benchMod.run(projectDir, outputFile);
	}
}

async function getOutputFile(benchmarkName) {
	let file;
	if (args.output) {
		file = pathToFileURL(path.resolve(args.output));
	} else {
		file = new URL(`./results/${benchmarkName}-bench-${Date.now()}.json`, import.meta.url);
	}

	// Prepare output file directory
	await fs.mkdir(new URL('./', file), { recursive: true });

	return file;
}
