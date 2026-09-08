import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Rolldown } from 'vite';
import { generateContentHash } from '../../core/encryption.js';
import { prependForwardSlash, slash } from '../../core/path.js';
import type { ImageMetadata } from '../types.js';
import { imageMetadata } from './metadata.js';

export { hashTransform, propsToFilename } from './hash.js';

type FileEmitter = (opts: Parameters<Rolldown.PluginContext['emitFile']>[0]) => string;
type ImageMetadataWithContents = ImageMetadata & { contents?: Buffer };

type SvgCacheKey = { hash: string };

// Global cache for SVG content deduplication
const svgContentCache = new WeakMap<SvgCacheKey, { handle: string; filename: string }>();

const keyRegistry = new Map<string, SvgCacheKey>();

function keyFor(hash: string): SvgCacheKey {
	let key = keyRegistry.get(hash);
	if (!key) {
		key = { hash };
		keyRegistry.set(hash, key);
	}
	return key;
}

/**
 * Handles SVG deduplication by checking if the content already exists in cache.
 */
async function handleSvgDeduplication(
	fileData: Buffer,
	filename: string,
	fileEmitter: FileEmitter,
): Promise<string> {
	const contentHash = await generateContentHash(fileData.buffer as ArrayBuffer);
	const key = keyFor(contentHash);
	const existing = svgContentCache.get(key);

	if (existing) {
		// Emit file again with the same filename to get a new handle
		// This ensures Rolldown knows about this handle while maintaining deduplication on disk
		const handle = fileEmitter({
			name: existing.filename,
			source: fileData,
			type: 'asset',
		});
		return handle;
	} else {
		// First time seeing this SVG content - emit it
		const handle = fileEmitter({
			name: filename,
			source: fileData,
			type: 'asset',
		});
		svgContentCache.set(key, { handle, filename });
		return handle;
	}
}

const TRANSIENT_ERROR_CODES = new Set(['EMFILE', 'ENFILE', 'EAGAIN', 'EBUSY']);

// Limits concurrent fs.readFile calls to avoid EMFILE when the bundler loads
// thousands of images in parallel. 200 is well below typical OS defaults
// (1024 on Linux, ~8000 on macOS) while leaving headroom for other I/O.
const MAX_CONCURRENT_READS = 200;
let activeReads = 0;
const readQueue: Array<() => void> = [];

/**
 * Reads a file with concurrency limiting and retry logic for transient OS errors
 * like EMFILE (too many open files). Large projects can exhaust file descriptors
 * when the bundler loads thousands of images concurrently.
 */
async function readFileWithRetry(url: URL, maxRetries = 5): Promise<Buffer> {
	// Wait for a slot if at the concurrency limit
	if (activeReads >= MAX_CONCURRENT_READS) {
		await new Promise<void>((resolve) => readQueue.push(resolve));
	}
	activeReads++;
	try {
		for (let attempt = 0; ; attempt++) {
			try {
				return await fs.readFile(url);
			} catch (err) {
				const code =
					err instanceof Error && 'code' in err ? (err as NodeJS.ErrnoException).code : undefined;
				if (code && TRANSIENT_ERROR_CODES.has(code) && attempt < maxRetries) {
					await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** attempt));
					continue;
				}
				throw err;
			}
		}
	} finally {
		activeReads--;
		if (readQueue.length > 0) {
			readQueue.shift()!();
		}
	}
}

/**
 * Processes an image file and emits its metadata and optionally its contents. This function supports both build and development modes.
 *
 * @param {string | undefined} id - The identifier or path of the image file to process. If undefined, the function returns immediately.
 * @param {FileEmitter | undefined} [fileEmitter] - Function for emitting files during the build process. May throw in certain scenarios.
 * @return {Promise<ImageMetadataWithContents | undefined>} Resolves to metadata with optional image contents or `undefined` if processing fails.
 */
export async function emitImageMetadata(
	id: string | undefined,
	fileEmitter?: FileEmitter,
): Promise<ImageMetadataWithContents | undefined> {
	if (!id) {
		return undefined;
	}

	const url = pathToFileURL(id);
	let fileData: Buffer;
	try {
		fileData = await readFileWithRetry(url);
	} catch (err) {
		if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
			return undefined;
		}
		throw err;
	}

	const fileMetadata = await imageMetadata(fileData, id);
	if (path.extname(id).toLowerCase() === '.apng') {
		fileMetadata.format = 'apng';
	}

	const emittedImage: Omit<ImageMetadataWithContents, 'fsPath'> = {
		src: '',
		...fileMetadata,
	};

	// Private for now, we generally don't want users to rely on filesystem paths, but we need it so that we can maybe remove the original asset from the build if it's unused.
	Object.defineProperty(emittedImage, 'fsPath', {
		enumerable: false,
		writable: false,
		value: fileURLToNormalizedPath(url),
	});

	// Build
	let isBuild = typeof fileEmitter === 'function';
	if (isBuild) {
		const pathname = decodeURI(url.pathname);
		const filename = path.basename(pathname, path.extname(pathname) + `.${fileMetadata.format}`);

		try {
			let handle: string;

			if (fileMetadata.format === 'svg') {
				// check if this content already exists
				handle = await handleSvgDeduplication(fileData, filename, fileEmitter!);
			} else {
				// Non-SVG assets: emit normally
				handle = fileEmitter!({
					name: filename,
					source: fileData,
					type: 'asset',
				});
			}

			emittedImage.src = `__ASTRO_ASSET_IMAGE__${handle}__`;
		} catch {
			isBuild = false;
		}
	}

	if (!isBuild) {
		// Pass the original file information through query params so we don't have to load the file twice
		url.searchParams.append('origWidth', fileMetadata.width.toString());
		url.searchParams.append('origHeight', fileMetadata.height.toString());
		url.searchParams.append('origFormat', fileMetadata.format);

		emittedImage.src = `/@fs` + prependForwardSlash(fileURLToNormalizedPath(url));
	}

	return emittedImage as ImageMetadataWithContents;
}

function fileURLToNormalizedPath(filePath: URL): string {
	// Uses `slash` instead of Vite's `normalizePath` to avoid CJS bundling issues.
	return slash(fileURLToPath(filePath) + filePath.search).replace(/\\/g, '/');
}
