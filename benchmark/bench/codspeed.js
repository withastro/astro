import { Bench } from 'tinybench';
import { withCodSpeed } from '@codspeed/tinybench-plugin';
import { execaCommand } from 'execa';
import { astroBin } from './_util.js';
import { fileURLToPath } from 'node:url';
import { waitUntilBusy } from 'port-authority';
import { benchmarkRenderTime } from './render.js';
import { benchmarkCannon } from './server-stress.js';
import { makeProject } from '../index.js';

const bench = withCodSpeed(new Bench());
const memory = await makeProject('memory-default');
const render = await makeProject('render-default');
const stress = await makeProject('server-stress-default');
const rootMemory = fileURLToPath(memory);
const rootRender = fileURLToPath(render);
const rootStress = fileURLToPath(stress);

const port = 4322;
bench
	.add('Memory', async () => {
		await execaCommand(`node --expose-gc --max_old_space_size=256 ${astroBin} build`, {
			cwd: rootMemory,
			stdio: 'inherit',
		});
	})
	.add('Render', async () => {
		await execaCommand(`${astroBin} build`, {
			cwd: rootRender,
			stdio: 'inherit',
		});

		console.log('Previewing...');
		const previewProcess = execaCommand(`${astroBin} preview --port ${port}`, {
			cwd: rootRender,
			stdio: 'inherit',
		});

		console.log('Waiting for server ready...');
		await waitUntilBusy(port, { timeout: 5000 });

		console.log('Running benchmark...');
		const _result = await benchmarkRenderTime();

		console.log('Killing server...');
		if (!previewProcess.kill('SIGTERM')) {
			console.warn('Failed to kill server process id:', previewProcess.pid);
		}
	})
	.add('Server stress', async () => {
		console.log('Building...');
		await execaCommand(`${astroBin} build`, {
			cwd: rootStress,
			stdio: 'inherit',
		});

		console.log('Previewing...');
		const previewProcess = execaCommand(`${astroBin} preview --port ${port}`, {
			cwd: rootStress,
			stdio: 'inherit',
		});

		console.log('Waiting for server ready...');
		await waitUntilBusy(port, { timeout: 5000 });

		console.log('Running benchmark...');
		const result = await benchmarkCannon();

		console.log('Killing server...');
		if (!previewProcess.kill('SIGTERM')) {
			console.warn('Failed to kill server process id:', previewProcess.pid);
		}
	});

await bench.run();
console.table(bench.table());
