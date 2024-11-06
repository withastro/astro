import path from 'node:path';
import { withCodSpeed } from '@codspeed/tinybench-plugin';
import { Bench } from 'tinybench';
import { exec } from 'tinyexec';
import { renderPages } from '../make-project/render-default.js';
import { astroBin } from './_util.js';

export async function run({ memory: _memory, render, stress: _stress }) {
	const options = {
		iterations: 10,
	};
	const bench = process.env.CODSPEED ? withCodSpeed(new Bench(options)) : new Bench(options);
	let app;
	bench.add(
		'Rendering',
		async () => {
			console.info('Start task.');
			const result = {};
			for (const fileName of renderPages) {
				const pathname = '/' + fileName.slice(0, -path.extname(fileName).length);
				const request = new Request(new URL(pathname, 'http://exmpale.com'));
				const response = await app.render(request);
				const html = await response.text();
				if (!result[pathname]) result[pathname] = [];
				result[pathname].push(html);
			}
			console.info('Finish task.');
			return result;
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

				const entry = new URL('./dist/server/entry.mjs', `file://${render.root}`);
				const { manifest, createApp } = await import(entry);
				app = createApp(manifest);
				app.manifest = manifest;
			},
		},
	);

	await bench.run();
	console.table(bench.table());
}
