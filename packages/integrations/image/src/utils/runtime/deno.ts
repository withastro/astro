

// @ts-ignore
export const isDeno = typeof Deno !== 'undefined';
const denoPathSpecifier = 'https://deno.land/std/path/mod.ts';

let preloaded = false;
let path: any;

export async function preload() {
	if(!preloaded) {
		console.log("PRELOADIN2");
		path = await import(denoPathSpecifier);
		preloaded = true;
	}
}

export async function readFile(url: URL | string): Promise<Uint8Array> {
	// @ts-ignore
	const data: Uint8Array = await Deno.readFile(url);
	return data;
}

export function fileURLToPath(url: URL): string {
	return path.fromFileUrl(url.toString());
}
