import crypto from 'node:crypto';
import {
	ByteLengthQueuingStrategy,
	CountQueuingStrategy,
	ReadableByteStreamController,
	ReadableStream,
	ReadableStreamBYOBReader,
	ReadableStreamBYOBRequest,
	ReadableStreamDefaultController,
	ReadableStreamDefaultReader,
	TransformStream,
	WritableStream,
	WritableStreamDefaultController,
	WritableStreamDefaultWriter,
} from 'node:stream/web';
import { File, FormData, Headers, Request, Response, fetch } from 'undici';

// NOTE: This file does not intend to polyfill everything that exists, its main goal is to make life easier
// for users deploying to runtime that do support these features. In the future, we hope for this file to disappear.

// HACK (2023-08-18) Stackblitz does not support Node 18 yet, so we'll fake Node 16 support for some time until it's supported
// TODO: Remove when Node 18 is supported on Stackblitz. File should get imported from `node:buffer` instead of `undici` once this is removed
const isStackblitz = process.env.SHELL === '/bin/jsh' && process.versions.webcontainer != null;

export function apply() {
	if (isStackblitz) {
		const neededPolyfills = {
			ByteLengthQueuingStrategy,
			CountQueuingStrategy,
			ReadableByteStreamController,
			ReadableStream,
			ReadableStreamBYOBReader,
			ReadableStreamBYOBRequest,
			ReadableStreamDefaultController,
			ReadableStreamDefaultReader,
			TransformStream,
			WritableStream,
			WritableStreamDefaultController,
			WritableStreamDefaultWriter,
			File,
			FormData,
			Headers,
			Request,
			Response,
			fetch,
		};

		for (let polyfillName of Object.keys(neededPolyfills)) {
			if (Object.hasOwnProperty.call(globalThis, polyfillName)) continue;

			// Add polyfill to globalThis
			Object.defineProperty(globalThis, polyfillName, {
				configurable: true,
				enumerable: true,
				writable: true,
				value: neededPolyfills[polyfillName as keyof typeof neededPolyfills],
			});
		}
	}

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
