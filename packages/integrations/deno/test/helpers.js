import { fromFileUrl } from './deps.js';
const dir = new URL('./', import.meta.url);

export async function runBuild(fixturePath) {
	let proc = Deno.run({
		cmd: ['node', '../../../../../astro/astro.js', 'build', '--silent'],
		cwd: fromFileUrl(new URL(fixturePath, dir)),
	});
	await proc.status();
	return async () => await proc.close();
}

export async function runBuildAndStartApp(fixturePath, cb) {
	const url = new URL(fixturePath, dir);
	const close = await runBuild(fixturePath);
	const mod = await import(new URL('./dist/entry.mjs', url));
	await cb();
	await mod.stop();
	await close();
}
