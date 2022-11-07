import type fsNS from 'node:fs/promises';
import type urlNS from 'node:url';

export const isNodeJS = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]';
const nodeFsPromisesSpecifier = 'node:fs/promises';
const nodeUrlSpecifier = 'node:url';

let preloaded = false;
let fsMod: typeof fsNS;
let urlMod: typeof urlNS;

export async function preload() {
	if(!preloaded) {
		console.log("PRELOADING");
		fsMod = await import(nodeFsPromisesSpecifier);
		urlMod = await import(nodeUrlSpecifier);
		preloaded = true;
	}
}

export async function readFile(url: URL | string): Promise<Uint8Array> {
	return await fsMod.readFile(url);
}

export function fileURLToPath(url: URL): string {
	return urlMod.fileURLToPath(url);
}
