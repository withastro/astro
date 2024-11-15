import path from 'node:path';
import { withCodSpeed } from '@codspeed/tinybench-plugin';
import { Bench } from 'tinybench';
import { exec } from 'tinyexec';
import { astroBin } from './_util.js';

export async function run({ memory: _memory, render, stress: _stress }) {
	const options = {
		iterations: 10,
	};
	const bench = process.env.CODSPEED ? withCodSpeed(new Bench(options)) : new Bench(options);
	await exec(astroBin, ['build'], {
		nodeOptions: {
			cwd: render.root,
			stdio: 'inherit',
		},
	});

	const entry = new URL('./dist/server/entry.mjs', `file://${render.root}`);
	const { manifest, createApp } = await import(entry);
	const streamingApp = createApp(manifest, true);
	const nonStreamingApp = createApp(manifest, false);
	bench
		.add('Rendering: streaming [true], .astro file', async () => {
			console.info('Start task.');
			const request = new Request(new URL('http://exmpale.com/astro'));
			await streamingApp.render(request);
			console.info('Finish task.');
		})
		.add('Rendering: streaming [true], .md file', async () => {
			console.info('Start task.');
			const request = new Request(new URL('http://exmpale.com/md'));
			await streamingApp.render(request);
			console.info('Finish task.');
		})
		.add('Rendering: streaming [true], .mdx file', async () => {
			console.info('Start task.');
			const request = new Request(new URL('http://exmpale.com/mdx'));
			await streamingApp.render(request);
			console.info('Finish task.');
		})

		.add('Rendering: streaming [false], .astro file', async () => {
			console.info('Start task.');
			const request = new Request(new URL('http://exmpale.com/astro'));
			await nonStreamingApp.render(request);
			console.info('Finish task.');
		})
		.add('Rendering: streaming [false], .md file', async () => {
			console.info('Start task.');
			const request = new Request(new URL('http://exmpale.com/md'));
			await nonStreamingApp.render(request);
			console.info('Finish task.');
		})
		.add('Rendering: streaming [false], .mdx file', async () => {
			console.info('Start task.');
			const request = new Request(new URL('http://exmpale.com/mdx'));
			await nonStreamingApp.render(request);
			console.info('Finish task.');
		});

	await bench.run();
	console.table(bench.table());
}
