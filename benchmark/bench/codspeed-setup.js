import { fileURLToPath } from 'node:url';
import { exec } from 'tinyexec';
import { astroBin, makeProject } from './_util.js';

/**
 * Setup script for codspeed benchmarks.
 * This builds the benchmark projects which are required for the rendering benchmarks.
 * This is separated out so it can run in a separate CI job since it takes a long time.
 */
async function setup() {
	for (const name of ['render-bench', 'rendering-perf']) {
		console.log(`Setting up ${name} project...`);
		const projectDir = await makeProject(name);
		const root = fileURLToPath(projectDir);

		console.log(`Building project at ${root}...`);
		await exec(astroBin, ['build'], {
			nodeOptions: {
				cwd: root,
				stdio: 'inherit',
			},
		});
	}
}

setup().catch((error) => {
	console.error('Setup failed:', error);
	process.exit(1);
});
