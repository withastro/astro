import * as nodeImpl from './nodejs.js';
import * as denoImpl from './deno.js';

export type Runtime = 'node' | 'deno' | 'cloudflare' | 'unknown';

interface Implementation {
	preload: () => Promise<void>;
	readFile: (url: string | URL) => Promise<Uint8Array>;
	fileURLToPath: (url: URL) => string;
	cpuCount: () => number;
	isMainThread: () => boolean;
	createWorker: (scriptURL: string | URL) => Worker;
}

let preloaded = false;

export const runtime: Runtime =
	nodeImpl.isNodeJS ? 'node' :
	denoImpl.isDeno ? 'deno' : 'unknown';

let implementation: Implementation | undefined;
switch(runtime) {
	case 'node': {
		implementation = nodeImpl;
		break;
	}
	case 'deno': {
		implementation = denoImpl;
		break;
	}
}

function throwIfNoRuntime() {
	if(typeof implementation === 'undefined') {
		runtimeNotSupported();
	}
}

function throwIfNotPreloaded() {
	if(!preloaded) {
		throw new Error(`The runtime has not been loaded.`);
	}
}

function runtimeNotSupported(): never {
	if(runtime === 'unknown') {
		throw new Error(`Unknown runtime, not supported by @astrojs/image`);
	}

	throw new Error(`Runtime ${runtime} is not supported.`);
}

export async function preload() {
	throwIfNoRuntime();
	if(!preloaded) {
		await implementation!.preload();
		preloaded = true;
	}
}

export async function readFile(src: URL | string): Promise<Uint8Array> {
	throwIfNoRuntime()!;
	if(!preloaded) {
		await preload();
	}
	return implementation!.readFile(src);
}

export function fileURLToPath(url: URL | string): string {
	if(typeof url === 'string') {
		return url;
	}

	throwIfNoRuntime();
	throwIfNotPreloaded();
	return implementation!.fileURLToPath(url);
}

export function cpuCount(): number {
	throwIfNoRuntime();
	throwIfNotPreloaded();
	return implementation!.cpuCount();
}

export function isMainThread(): boolean {
	throwIfNoRuntime();
	throwIfNotPreloaded();
	return implementation!.isMainThread();
}
