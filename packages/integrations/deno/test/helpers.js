import { readableStreamFromReader, fromFileUrl } from './deps.js';
const dir = new URL('./', import.meta.url);

export async function runBuild(fixturePath) {
	let proc = Deno.run({
		cmd: ['node', '../../../../../astro/astro.js', 'build', '--silent'],
		cwd: fromFileUrl(new URL(fixturePath, dir)),
	});
	await proc.status();
	return async () => await proc.close();
}

export async function startModFromImport(baseUrl) {
	const entryUrl = new URL('./dist/server/entry.mjs', baseUrl);
	const mod = await import(entryUrl);

	if (!mod.running()) {
		mod.start();
	}

	return () => mod.stop();
}

export async function startModFromSubprocess(baseUrl) {
	const entryUrl = new URL('./dist/server/entry.mjs', baseUrl);
	let proc = Deno.run({
		cmd: ['deno', 'run', '--allow-env', '--allow-net', fromFileUrl(entryUrl)],
		cwd: fromFileUrl(baseUrl),
		stderr: 'piped',
	});
	const stderr = readableStreamFromReader(proc.stderr);
	const dec = new TextDecoder();
	for await (let bytes of stderr) {
		let msg = dec.decode(bytes);
		if (msg.includes(`Server running`)) {
			break;
		}
	}
	return () => proc.close();
}

export async function runBuildAndStartApp(fixturePath, cb) {
	const url = new URL(fixturePath, dir);
	const close = await runBuild(fixturePath);
	const stop = await startModFromImport(url);

	await cb();
	await stop();
	await close();
}

export async function runBuildAndStartAppFromSubprocess(fixturePath, cb) {
	const url = new URL(fixturePath, dir);
	const close = await runBuild(fixturePath);
	const stop = await startModFromSubprocess(url);

	await cb();
	await stop();
	await close();
}
