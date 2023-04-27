import { fileURLToPath } from "url";
import { execa } from "execa";
import { parseCliDevStart } from '../dist/testing/index.js';
export * from '../dist/testing/utils.js';

const cliPath = fileURLToPath(new URL('../astro.js', import.meta.url));

/** Returns a process running the Astro CLI.
 * @returns {import('execa').ExecaChildProcess} 
 */ 
export function cli(/** @type {string[]} */ ...args) {
	const spawned = execa('node', [cliPath, ...args], {
		env: {"ASTRO_TELEMETRY_DISABLED": "1"},
	});

	spawned.stdout?.setEncoding('utf8');

	return spawned;
}

export async function cliServerLogSetup(/** @type {string[]} */ args = [], cmd = 'dev') {
	const proc = cli(cmd, ...args);

	const {messages} = await parseCliDevStart(proc);

	const local = messages.find((msg) => msg.includes('Local'))?.replace(/Local\s*/g, '');
	const network = messages.find((msg) => msg.includes('Network'))?.replace(/Network\s*/g, '');

	return {local, network};
}
