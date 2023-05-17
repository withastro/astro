import { fromFileUrl, readableStreamFromReader } from './deps.ts';
const dir = new URL('./', import.meta.url);

export function loadFixture(fixturePath: string, envionmentVariables?: Record<string, string>) {
	async function runBuild() {
		const proc = Deno.run({
			cmd: ['node', '../../../../../../astro/astro.js', 'build'],
			env: envionmentVariables,
			cwd: fromFileUrl(new URL(fixturePath, dir)),
		});
		await proc.status();
		proc.close();
	}

	async function runApp(entryPath: string) {
		const entryUrl = new URL(entryPath, dir);
		let proc = Deno.run({
			cmd: ['deno', 'run', '--allow-env', '--allow-net', fromFileUrl(entryUrl)],
			env: envionmentVariables,
			//cwd: fromFileUrl(entryUrl),
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

	async function cleanup() {
		const netlifyPath = new URL('.netlify', new URL(fixturePath, dir));
		const distPath = new URL('dist', new URL(fixturePath, dir));

		// remove the netlify folder
		await Deno.remove(netlifyPath, { recursive: true });

		// remove the dist folder
		await Deno.remove(distPath, { recursive: true });
	}

	return {
		runApp,
		runBuild,
		cleanup,
	};
}
