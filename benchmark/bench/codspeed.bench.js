import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import { exec } from 'tinyexec';
import { beforeAll, bench, describe } from 'vitest';
import { astroBin, makeProject } from './_util.js';


const staticRoot = fileURLToPath(new URL('../static-projects/build-static', import.meta.url));
const hybridRoot = fileURLToPath(new URL('../static-projects/build-hybrid', import.meta.url));
const serverRoot = fileURLToPath(new URL('../static-projects/build-server', import.meta.url));

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
}, 900000);

describe('Bench rendering', () => {
	bench('Rendering: streaming [true], .astro file', async () => {
		const request = new Request(new URL('http://exmpale.com/astro'));
		await streamingApp.render(request);
	});
	bench('Rendering: streaming [true], .md file', async () => {
		const request = new Request(new URL('http://exmpale.com/md'));
		await streamingApp.render(request);
	});
	bench('Rendering: streaming [true], .mdx file', async () => {
		const request = new Request(new URL('http://exmpale.com/mdx'));
		await streamingApp.render(request);
	});

	bench('Rendering: streaming [false], .astro file', async () => {
		const request = new Request(new URL('http://exmpale.com/astro'));
		await nonStreamingApp.render(request);
	});
	bench('Rendering: streaming [false], .md file', async () => {
		const request = new Request(new URL('http://exmpale.com/md'));
		await nonStreamingApp.render(request);
	});
	bench('Rendering: streaming [false], .mdx file', async () => {
		const request = new Request(new URL('http://exmpale.com/mdx'));
		await nonStreamingApp.render(request);
	});
});

describe('Bench build time', () => {
	bench('Build: full static site', async () => {
		await build({
			root: staticRoot,
			logLevel: 'error',
		});
	}, { timeout: 300000 });

	bench('Build: hybrid site (static + server)', async () => {
		await build({
			root: hybridRoot,
			logLevel: 'error',
		});
	}, { timeout: 300000 });

	bench('Build: full server site', async () => {
		await build({
			root: serverRoot,
			logLevel: 'error',
		});
	}, { timeout: 300000 });
});
