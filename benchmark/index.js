import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import mri from 'mri';
import { makeProject } from './make-project.js';

const args = mri(process.argv.slice(2));

if (args.help || args.h) {
	console.log(`\
astro-benchmark <command> [options]

Command
  [empty]         Run all benchmarks
  memory          Run build memory and speed test
  server-stress   Run server stress test

Options
  --project <project-name>       Project to use for benchmark, see make-project.js
  --output  <output-file>        Output file to write results to
  --compare <file-a>,<file-b>    Compare two output files
`);
	process.exit(0);
}

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
