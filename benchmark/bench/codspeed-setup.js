import { fileURLToPath } from 'node:url';
import { exec } from 'tinyexec';
import { astroBin, makeProject } from './_util.js';

/**
 * Setup script for codspeed benchmarks.
 * This builds the render-bench project which is required for the rendering benchmarks.
 * This is separated out so it can run in a separate CI job since it takes a long time.
 */
async function setup() {
	console.log('Setting up render-bench project...');
	const render = await makeProject('render-bench');
	const root = fileURLToPath(render);

	console.log(`Building project at ${root}...`);
	await exec(astroBin, ['build'], {
		nodeOptions: {
			cwd: root,
			stdio: 'inherit',
		},
	});
}

setup().catch((error) => {
	console.error('Setup failed:', error);
	process.exit(1);
});
