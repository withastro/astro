import { fileURLToPath } from 'url';
import { execaCommand } from 'execa';

const astro = fileURLToPath(new URL('../packages/astro/astro.js', import.meta.url));
const port = 4321;

/** Default project to run for this benchmark if not specified */
export const defaultProject = 'memory-default';

/**
 * @param {URL} projectDir
 * @param {URL} outputFile
 */
export async function run(projectDir, outputFile) {
	const root = fileURLToPath(projectDir);

	console.log('Building and benchmarking...');
	await execaCommand(`${astro} build`, {
		cwd: root,
		stdio: 'inherit',
		env: {
			ASTRO_TIMER_PATH: fileURLToPath(outputFile),
		},
	});

	console.log('Results written to', fileURLToPath(outputFile));

	console.log('Done!');
}

/**
 *
 * @param {any} outputA
 * @param {any} outputB
 */
export async function compare(outputA, outputB) {}
