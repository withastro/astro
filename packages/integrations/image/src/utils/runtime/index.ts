import type fsMod from 'node:fs/promises';

import * as nodeImpl from './nodejs.js';
import * as denoImpl from './deno.js';

export type Runtime = 'node' | 'deno' | 'cloudflare' | 'unknown';

interface Implementation {
	preload: () => Promise<void>;
	readFile: (url: string | URL) => Promise<Uint8Array>;
	fileURLToPath: (url: URL) => string;
}

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

function runtimeNotSupported(): never {
	if(runtime === 'unknown') {
		throw new Error(`Unknown runtime, not supported by @astrojs/image`);
	}

	throw new Error(`Runtime ${runtime} is not supported.`);
}

export async function preload() {
	throwIfNoRuntime();
	implementation!.preload();
}

export async function readFile(src: URL | string): Promise<Uint8Array> {
	throwIfNoRuntime()!;
	return implementation!.readFile(src);
}

export function fileURLToPath(url: URL | string): string {
	if(typeof url === 'string') {
		return url;
	}

	throwIfNoRuntime();
	return implementation!.fileURLToPath(url);
}
