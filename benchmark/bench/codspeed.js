import { withCodSpeed } from '@codspeed/tinybench-plugin';
import { waitUntilBusy } from 'port-authority';
import { Bench } from 'tinybench';
import { exec } from 'tinyexec';
import { astroBin } from './_util.js';
import { benchmarkRenderTime } from './render.js';

export async function run({ memory: _memory, render, stress: _stress }) {
	const bench = process.env.CODSPEED ? withCodSpeed(new Bench()) : new Bench();
	const port = 4322;

	let previewProcess;

	bench.add(
		'Rendering',
		async () => {
			console.info('Bench rendering.');
			return await benchmarkRenderTime(port);
		},
		{
			async beforeAll() {
				// build for rendering
				await exec(astroBin, ['build'], {
					nodeOptions: {
						cwd: render.root,
						stdio: 'inherit',
					},
				});

				console.info('Previewing.');
				previewProcess = exec(astroBin, ['preview', '--port', port], {
					nodeOptions: {
						cwd: render.root,
						stdio: 'inherit',
					},
					throwOnError: true,
				});
				console.info('Waiting for server ready...');
				await waitUntilBusy(port, { timeout: 10000 });
			},
			async afterAll() {
				console.info('Killing preview server.');
				if (!previewProcess.kill()) {
					console.warn('Failed to kill server process id:', previewProcess.pid);
				}
			},
		},
	);

	await bench.run();
	console.table(bench.table());
}
