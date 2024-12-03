import { fileURLToPath } from 'node:url';
import { exec } from 'tinyexec';
import { beforeAll, bench, describe } from 'vitest';
import { astroBin, makeProject } from './_util.js';
let streamingApp;
let nonStreamingApp;
beforeAll(async () => {
	const render = await makeProject('render-bench');
	const root = fileURLToPath(render);
	await exec(astroBin, ['build'], {
		nodeOptions: {
			cwd: root,
			stdio: 'inherit',
		},
	});
	const entry = new URL('./dist/server/entry.mjs', `file://${root}`);
	const { manifest, createApp } = await import(entry);
	streamingApp = createApp(manifest, true);
	nonStreamingApp = createApp(manifest, false);
}, 60000);

describe('Rendering:', () => {
	bench('streaming [true], .astro file', async () => {
		const request = new Request(new URL('http://exmpale.com/astro'));
		await streamingApp.render(request);
	});
	bench('streaming [true], .md file', async () => {
		const request = new Request(new URL('http://exmpale.com/md'));
		await streamingApp.render(request);
	});
	bench('streaming [true], .mdx file', async () => {
		const request = new Request(new URL('http://exmpale.com/mdx'));
		await streamingApp.render(request);
	});

	bench('streaming [false], .astro file', async () => {
		const request = new Request(new URL('http://exmpale.com/astro'));
		await nonStreamingApp.render(request);
	});
	bench('streaming [false], .md file', async () => {
		const request = new Request(new URL('http://exmpale.com/md'));
		await nonStreamingApp.render(request);
	});
	bench('streaming [false], .mdx file', async () => {
		const request = new Request(new URL('http://exmpale.com/mdx'));
		await nonStreamingApp.render(request);
	});
});
