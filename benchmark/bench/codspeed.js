import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { withCodSpeed } from '@codspeed/tinybench-plugin';
import { waitUntilBusy } from 'port-authority';
import { Bench } from 'tinybench';
import { exec } from 'tinyexec';
import { astroBin } from './_util.js';
import { benchmarkRenderTime } from './render.js';
import { benchmarkCannon } from './server-stress.js';

export async function run({ memory, render, _stress }) {
	const bench = process.env.CODSPEED ? withCodSpeed(new Bench()) : new Bench();

	bench
		.add('memory', async () => {
			await exec('node', ['--expose-gc', '--max_old_space_size=10000', astroBin, 'build'], {
				nodeOptions: {
					cwd: memory.root,
					stdio: 'inherit',
					env: {
						ASTRO_TIMER_PATH: memory.output,
					},
				},
			});
		})
		.add(
			'render',
			async () => {
				console.info('Bench rendering.');
				const port = 4322;

				console.info('Previewing...');
				const previewProcess = exec(astroBin, ['preview', '--port', port], {
					nodeOptions: {
						cwd: render.root,
						stdio: 'inherit',
					},
				});

				console.info('Waiting for server ready...');
				await waitUntilBusy(port, { timeout: 5000 });

				console.info('Running benchmark...');
				const results = await benchmarkRenderTime();

				console.info('Killing server...');
				if (!previewProcess.kill('SIGTERM')) {
					console.warn('Failed to kill server process id:', previewProcess.pid);
				}

				return results;
			},
			{
				async beforeAll() {
					await exec(astroBin, ['build'], {
						nodeOptions: {
							cwd: render.root,
							stdio: 'inherit',
						},
					});
				},
			},
		);
	// NOTE: not needed for now
	// .add(
	// 	'stress',
	// 	async () => {
	// 		console.info('Bench stress test.');
	// 		const port = 4323;
	//
	// 		console.info('Previewing...');
	// 		const previewProcess = exec(astroBin, ['preview', '--port', port], {
	// 			nodeOptions: {
	// 				cwd: stress.root,
	// 				stdio: 'inherit',
	// 			},
	// 		});
	//
	// 		console.info('Waiting for server ready...');
	// 		await waitUntilBusy(port, { timeout: 5000 });
	//
	// 		console.info('Running benchmark...');
	// 		const result = await benchmarkCannon();
	//
	// 		console.info('Killing server...');
	// 		if (!previewProcess.kill('SIGTERM')) {
	// 			console.warn('Failed to kill server process id:', previewProcess.pid);
	// 		}
	//
	// 		return result;
	// 	},
	// 	{
	// 		async beforeAll() {
	// 			console.info('Building...');
	// 			await exec(astroBin, ['build'], {
	// 				nodeOptions: {
	// 					cwd: stress.root,
	// 					stdio: 'inherit',
	// 				},
	// 			});
	// 		},
	// 	},
	// );

	await bench.run();
	console.table(bench.table());
}
