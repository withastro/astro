import { Bench } from 'tinybench';
import { withCodSpeed } from '@codspeed/tinybench-plugin';
import { exec } from 'tinyexec';
import { astroBin } from './_util.js';
import { waitUntilBusy } from 'port-authority';
import { benchmarkRenderTime } from './render.js';
import { benchmarkCannon } from './server-stress.js';

export async function run({ memory, render, stress }) {
	const bench = process.env.CODE_SPEED ? withCodSpeed(new Bench()) : new Bench();
	bench
		.add('Memory', async () => {
			await exec('node', ['--expose-gc', '--max_old_space_size=10000', astroBin, 'build'], {
				nodeOptions: {
					cwd: memory.root,

					stdio: 'inherit',
				},
			});
		})
		.add('Render', async () => {
			const port = 4322;

			await exec(astroBin, ['build'], {
				nodeOptions: {
					cwd: render.root,
					stdio: 'inherit',
				},
			});

			console.info('Previewing...');
			const previewProcess = await exec(astroBin, ['build'], {
				nodeOptions: {
					cwd: render.root,
					stdio: 'inherit',
				},
			});

			console.info('Waiting for server ready...');
			await waitUntilBusy(port, { timeout: 5000 });

			console.info('Running benchmark...');
			await benchmarkRenderTime();

			console.info('Killing server...');
			if (!previewProcess.kill('SIGTERM')) {
				console.warn('Failed to kill server process id:', previewProcess.pid);
			}
		})
		.add('Server stress', async () => {
			const port = 4323;

			console.info('Building...');
			await exec(astroBin, ['build'], {
				nodeOptions: {
					cwd: stress.root,
					stdio: 'inherit',
				},
			});

			console.info('Previewing...');
			const previewProcess = await exec(astroBin, ['build'], {
				nodeOptions: {
					cwd: stress.root,
					stdio: 'inherit',
				},
			});

			console.info('Waiting for server ready...');
			await waitUntilBusy(port, { timeout: 5000 });

			console.info('Running benchmark...');
			await benchmarkCannon();

			console.info('Killing server...');
			if (!previewProcess.kill('SIGTERM')) {
				console.warn('Failed to kill server process id:', previewProcess.pid);
			}
		});

	await bench.run();
	console.table(bench.table());
}
