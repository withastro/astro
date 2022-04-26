// @ts-ignore
import { fromFileUrl } from './deps.ts';
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
