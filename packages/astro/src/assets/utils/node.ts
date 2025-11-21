import fs from 'node:fs/promises';
import path, { basename, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deterministicString } from 'deterministic-object-hash';
import type * as vite from 'vite';
import { generateContentHash } from '../../core/encryption.js';
import { prependForwardSlash, removeQueryString, slash } from '../../core/path.js';
import { shorthash } from '../../runtime/server/shorthash.js';
import type { ImageMetadata, ImageTransform } from '../types.js';
import { isESMImportedImage } from './imageKind.js';
import { imageMetadata } from './metadata.js';

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

// Taken from https://github.com/rollup/rollup/blob/a8647dac0fe46c86183be8596ef7de25bc5b4e4b/src/utils/sanitizeFileName.ts
// eslint-disable-next-line no-control-regex
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$%&*+,:;<=>?[\]^`{|}\u007F]/g;

/**
 * Converts a file path and transformation properties of the transformation image service, into a formatted filename.
 *
 * The formatted filename follows this structure:
 *
 * `<prefixDirname>/<baseFilename>_<hash><outputExtension>`
 *
 * - `prefixDirname`: If the image is an ESM imported image, this is the directory name of the original file path; otherwise, it will be an empty string.
 * - `baseFilename`: The base name of the file or a hashed short name if the file is a `data:` URI.
 * - `hash`: A unique hash string generated to distinguish the transformed file.
 * - `outputExtension`: The desired output file extension derived from the `transform.format` or the original file extension.
 *
 * ## Example
 * - Input: `filePath = '/images/photo.jpg'`, `transform = { format: 'png', src: '/images/photo.jpg' }`, `hash = 'abcd1234'`.
 * - Output: `/images/photo_abcd1234.png`
 *
 * @param {string} filePath - The original file path or data URI of the source image.
 * @param {ImageTransform} transform - An object representing the transformation properties, including format and source.
 * @param {string} hash - A unique hash used to differentiate the transformed file.
 * @return {string} The generated filename based on the provided input, transformations, and hash.
 */

export function propsToFilename(filePath: string, transform: ImageTransform, hash: string): string {
	let filename = decodeURIComponent(removeQueryString(filePath));
	const ext = extname(filename);
	if (filePath.startsWith('data:')) {
		filename = shorthash(filePath);
	} else {
		filename = basename(filename, ext).replace(INVALID_CHAR_REGEX, '_');
	}
	const prefixDirname = isESMImportedImage(transform.src) ? dirname(filePath) : '';

	let outputExt = transform.format ? `.${transform.format}` : ext;
	return `${prefixDirname}/${filename}_${hash}${outputExt}`;
}

/**
 * Transforms the provided `transform` object into a hash string based on selected properties
 * and the specified `imageService`.
 *
 * @param {ImageTransform} transform - The transform object containing various image transformation properties.
 * @param {string} imageService - The name of the image service related to the transform.
 * @param {string[]} propertiesToHash - An array of property names from the `transform` object that should be used to generate the hash.
 * @return {string} A hashed string created from the specified properties of the `transform` object and the image service.
 */
export function hashTransform(
	transform: ImageTransform,
	imageService: string,
	propertiesToHash: string[],
): string {
	// Extract the fields we want to hash
	const hashFields = propertiesToHash.reduce(
		(acc, prop) => {
			// It's possible for `transform[prop]` here to be undefined, or null, but that's fine because it's still consistent
			// between different transforms. (ex: every transform without a height will explicitly have a `height: undefined` property)
			acc[prop] = transform[prop];
			return acc;
		},
		{ imageService } as Record<string, unknown>,
	);
	return shorthash(deterministicString(hashFields));
}
