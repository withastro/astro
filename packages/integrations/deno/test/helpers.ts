import { fromFileUrl } from 'https://deno.land/std@0.110.0/path/mod.ts';
import { assert } from 'https://deno.land/std@0.158.0/testing/asserts.ts';
import { readableStreamFromReader } from 'https://deno.land/std@0.142.0/streams/conversion.ts';

const dir = new URL('./', import.meta.url);
const defaultURL = new URL('http://localhost:8085/');

export const defaultTestPermissions: Deno.PermissionOptions = {
	read: true,
	net: true,
	run: true,
	env: true,
};

declare type ExitCallback = () => void;

export async function runBuild(fixturePath: string) {
	const proc = Deno.run({
		cmd: ['node', '../../../../../astro/astro.js', 'build', '--silent'],
		cwd: fromFileUrl(new URL(fixturePath, dir)),
	});
	try {
		const status = await proc.status();
		assert(status.success);
	} finally {
		proc.close();
	}
}

export async function startModFromImport(baseUrl: URL): Promise<ExitCallback> {
	const entryUrl = new URL('./dist/server/entry.mjs', baseUrl);
	const mod = await import(entryUrl.toString());

	if (!mod.running()) {
		mod.start();
	}

	return () => mod.stop();
}

export async function startModFromSubprocess(baseUrl: URL): Promise<ExitCallback> {
	const entryUrl = new URL('./dist/server/entry.mjs', baseUrl);
	const proc = Deno.run({
		cmd: ['deno', 'run', '--allow-env', '--allow-net', fromFileUrl(entryUrl)],
		cwd: fromFileUrl(baseUrl),
		stderr: 'piped',
	});

	const stderr = readableStreamFromReader(proc.stderr);
	const dec = new TextDecoder();
	for await (const bytes of stderr) {
		const msg = dec.decode(bytes);
		if (msg.includes(`Server running`)) {
			break;
		}
	}

	return () => proc.close();
}

export async function runBuildAndStartApp(fixturePath: string) {
	const url = new URL(fixturePath, dir);

	await runBuild(fixturePath);
	const stop = await startModFromImport(url);

	return { url: defaultURL, stop };
}

export async function runBuildAndStartAppFromSubprocess(fixturePath: string) {
	const url = new URL(fixturePath, dir);

	await runBuild(fixturePath);
	const stop = await startModFromSubprocess(url);

	return { url: defaultURL, stop };
}
