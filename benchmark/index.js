import mri from 'mri';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const args = mri(process.argv.slice(2));

if (args.help || args.h) {
	console.log(`\
astro-benchmark <command> [options]

Command
  [empty]         Run all benchmarks
  memory          Run build memory and speed test
  render          Run rendering speed test
  server-stress   Run server stress test
  codspeed        Run codspeed test
  cli-startup     Run CLI startup speed test

Options
  --project <project-name>       Project to use for benchmark, see benchmark/make-project/ for available names
  --output  <output-file>        Output file to write results to
`);
	process.exit(0);
}

const commandName = args._[0];
const benchmarks = {
	memory: () => import('./bench/memory.js'),
	render: () => import('./bench/render.js'),
	'server-stress': () => import('./bench/server-stress.js'),
	'cli-startup': () => import('./bench/cli-startup.js'),
	codspeed: () => import('./bench/codspeed.js')
};

if (commandName && !(commandName in benchmarks)) {
	console.error(`Invalid benchmark name: ${commandName}`);
	process.exit(1);
}

if (commandName) {
		if (commandName === 'codspeed') {
			const render = await makeProject('render-bench');
			const rootRender = fileURLToPath(render);
			const bench = benchmarks[commandName];
			const benchMod = await bench();
			const payload = {
				render: {
					root: rootRender,
					output: await getOutputFile('render')
				},
			};
			await benchMod.run(payload);
		} else {
			// Run single benchmark
			const bench = benchmarks[commandName];
			const benchMod = await bench();
			const projectDir = await makeProject(args.project || benchMod.defaultProject);
			const outputFile = await getOutputFile(commandName);
			await benchMod.run(projectDir, outputFile);
		}
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

export async function makeProject(name) {
	console.log('Making project:', name);
	const projectDir = new URL(`./projects/${name}/`, import.meta.url);

	const makeProjectMod = await import(`./make-project/${name}.js`);
	await makeProjectMod.run(projectDir);

	console.log('Finished making project:', name);
	return projectDir;
}

/**
 * @param {string} benchmarkName
 */
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
