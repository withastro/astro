import xxhash from 'xxhash-wasm';

// Creates the WebAssembly instance.
const { h64Raw } = await xxhash();

export function hash(buffer: Buffer): string {
	return h64Raw(buffer).toString();
}
