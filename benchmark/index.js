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
	await benchMod.compare(path.resolve(outputA), path.resolve(outputB));
	process.exit(0);
}

const defaultOutputFile = args.output
	? path.resolve(args.output)
	: fileURLToPath(new URL(`./results/bench-${Date.now()}.json`, import.meta.url));

// Prepare output file directory
await fs.mkdir(path.dirname(defaultOutputFile), { recursive: true });

if (commandName) {
	// Run single benchmark
	const bench = benchmarks[commandName];
	const benchMod = await bench();
	const projectDir = await makeProject(args.project || benchMod.defaultProject);
	const outputFile = pathToFileURL(defaultOutputFile);
	await benchMod.run(projectDir, outputFile);
} else {
	// Run all benchmarks
	for (const name in benchmarks) {
		const bench = benchmarks[name];
		const benchMod = await bench();
		const projectDir = await makeProject(args.project || benchMod.defaultProject);
		// Prefix output file with benchmark name to avoid conflict
		const parsed = path.parse(defaultOutputFile);
		parsed.base = `${name}-${parsed.base}`;
		const outputFile = pathToFileURL(path.format(parsed));
		await benchMod.run(projectDir, outputFile);
	}
}
