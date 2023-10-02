import crypto from 'node:crypto';
import buffer from 'node:buffer';

export function apply() {
	// Remove when Node 18 is dropped for Node 20
	if (!globalThis.crypto) {
		Object.defineProperty(globalThis, 'crypto', {
			value: crypto.webcrypto,
		});
	}

	// Remove when Node 18 is dropped for Node 20
	if (!globalThis.File) {
		Object.defineProperty(globalThis, 'File', {
			value: buffer.File,
		});
	}
}
