import { File } from 'node:buffer';
import crypto from 'node:crypto';

// NOTE: This file does not intend to polyfill everything that exists, its main goal is to make life easier
// for users deploying to runtime that do support these features. In the future, we hope for this file to disappear.

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
			value: File,
		});
	}
}
