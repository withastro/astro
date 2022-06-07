// @ts-ignore
import { fromFileUrl, readableStreamFromReader } from './deps.ts';
const dir = new URL('./', import.meta.url);

export async function runBuild(fixturePath: string) {
	// @ts-ignore
	let proc = Deno.run({
		cmd: ['node', '../../../../../../astro/astro.js', 'build', '--silent'],
		cwd: fromFileUrl(new URL(fixturePath, dir)),
	});
	await proc.status();
	return async () => await proc.close();
}

export async function runApp(entryPath: string) {
	const entryUrl = new URL(entryPath, dir)
	let proc = Deno.run({
		cmd: ['deno', 'run', '--allow-env', '--allow-net', fromFileUrl(entryUrl)],
		//cwd: fromFileUrl(entryUrl),
		stderr: 'piped'
	});
	const stderr = readableStreamFromReader(proc.stderr);
	const dec = new TextDecoder();
	for await(let bytes of stderr) {
		let msg = dec.decode(bytes);
		if(msg.includes(`Server running`)) {
			break;
		}
	}
	return () => proc.close();
}
