import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as vite from 'vite';
import { generateContentHash } from '../../../core/encryption.js';
import { prependForwardSlash, slash } from '../../../core/path.js';
import type { ImageMetadata } from '../../types.js';
import { imageMetadata } from '../metadata.js';

type FileEmitter = vite.Rollup.EmitFile;
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
		// This ensures Rollup knows about this handle while maintaining deduplication on disk
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

/**
 * Processes an image file and emits its metadata and optionally its contents. This function supports both build and development modes.
 *
 * @param {string | undefined} id - The identifier or path of the image file to process. If undefined, the function returns immediately.
 * @param {boolean} _watchMode - **Deprecated**: Indicates if the method is operating in watch mode. This parameter will be removed or updated in the future.
 * @param {boolean} _experimentalSvgEnabled - **Deprecated**: A flag to enable experimental handling of SVG files. Embeds SVG file data if set to true.
 * @param {FileEmitter | undefined} [fileEmitter] - Function for emitting files during the build process. May throw in certain scenarios.
 * @return {Promise<ImageMetadataWithContents | undefined>} Resolves to metadata with optional image contents or `undefined` if processing fails.
 */
// We want to internally use this function until we fix the memory in the SVG features
export async function emitESMImage(
	id: string | undefined,
	/** @deprecated */
	_watchMode: boolean,
	// FIX: in Astro 6, this function should not be passed in dev mode at all.
	// Or rethink the API so that a function that throws isn't passed through.
	/** @deprecated */
	_experimentalSvgEnabled: boolean,
	fileEmitter?: FileEmitter,
): Promise<ImageMetadataWithContents | undefined> {
	if (!id) {
		return undefined;
	}

	const url = pathToFileURL(id);
	let fileData: Buffer;
	try {
		fileData = await fs.readFile(url);
	} catch {
		return undefined;
	}

	const fileMetadata = await imageMetadata(fileData, id);

	const emittedImage: Omit<ImageMetadataWithContents, 'fsPath'> = {
		src: '',
		...fileMetadata,
	};

	// Private for now, we generally don't want users to rely on filesystem paths, but we need it so that we can maybe remove the original asset from the build if it's unused.
	Object.defineProperty(emittedImage, 'fsPath', {
		enumerable: false,
		writable: false,
		value: id,
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
		fileData = await fs.readFile(url);
	} catch {
		return undefined;
	}

	const fileMetadata = await imageMetadata(fileData, id);

	const emittedImage: Omit<ImageMetadataWithContents, 'fsPath'> = {
		src: '',
		...fileMetadata,
	};

	// Private for now, we generally don't want users to rely on filesystem paths, but we need it so that we can maybe remove the original asset from the build if it's unused.
	Object.defineProperty(emittedImage, 'fsPath', {
		enumerable: false,
		writable: false,
		value: id,
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
