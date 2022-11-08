import type fsNS from 'node:fs/promises';
import type urlNS from 'node:url';
import type osNS from 'node:os';
import type workerNS from 'node:worker_threads';

export const isNodeJS = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]';
const nodeFsPromisesSpecifier = 'node:fs/promises';
const nodeUrlSpecifier = 'node:url';
const nodeOsSpecifier = 'node:os';
const nodeWorkerThreadsSpecifier = 'node:worker_threads';

let preloaded = false;
let fsMod: typeof fsNS;
let urlMod: typeof urlNS;
let osMod: typeof osNS;
let workerMod: typeof workerNS;

export async function preload() {
	if(!preloaded) {
		const mods = await Promise.all([
			import(nodeFsPromisesSpecifier),
			import(nodeUrlSpecifier),
			import(nodeOsSpecifier),
			import(nodeWorkerThreadsSpecifier)
		]);
		fsMod = mods[0];
		urlMod = mods[1];
		osMod = mods[2];
		workerMod = mods[3];
		preloaded = true;
	}
}

export async function readFile(url: URL | string): Promise<Uint8Array> {
	return await fsMod.readFile(url);
}

export function fileURLToPath(url: URL): string {
	return urlMod.fileURLToPath(url);
}

export function cpuCount(): number {
	return osMod.cpus().length;
}

export function isMainThread(): boolean {
	return workerMod.isMainThread;
}

export function createWorker(scriptURL: string | URL) {
	return new workerMod.Worker(scriptURL);
}
