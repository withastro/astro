import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateContentHash } from '../../core/encryption.js';
import { prependForwardSlash, slash } from '../../core/path.js';
import { imageMetadata } from './metadata.js';
import { hashTransform, propsToFilename } from './hash.js';
const svgContentCache = /* @__PURE__ */ new WeakMap();
const keyRegistry = /* @__PURE__ */ new Map();
function keyFor(hash) {
	let key = keyRegistry.get(hash);
	if (!key) {
		key = { hash };
		keyRegistry.set(hash, key);
	}
	return key;
}
async function handleSvgDeduplication(fileData, filename, fileEmitter) {
	const contentHash = await generateContentHash(fileData.buffer);
	const key = keyFor(contentHash);
	const existing = svgContentCache.get(key);
	if (existing) {
		const handle = fileEmitter({
			name: existing.filename,
			source: fileData,
			type: 'asset',
		});
		return handle;
	} else {
		const handle = fileEmitter({
			name: filename,
			source: fileData,
			type: 'asset',
		});
		svgContentCache.set(key, { handle, filename });
		return handle;
	}
}
async function emitImageMetadata(id, fileEmitter) {
	if (!id) {
		return void 0;
	}
	const url = pathToFileURL(id);
	let fileData;
	try {
		fileData = await fs.readFile(url);
	} catch {
		return void 0;
	}
	const fileMetadata = await imageMetadata(fileData, id);
	const emittedImage = {
		src: '',
		...fileMetadata,
	};
	Object.defineProperty(emittedImage, 'fsPath', {
		enumerable: false,
		writable: false,
		value: fileURLToNormalizedPath(url),
	});
	let isBuild = typeof fileEmitter === 'function';
	if (isBuild) {
		const pathname = decodeURI(url.pathname);
		const filename = path.basename(pathname, path.extname(pathname) + `.${fileMetadata.format}`);
		try {
			let handle;
			if (fileMetadata.format === 'svg') {
				handle = await handleSvgDeduplication(fileData, filename, fileEmitter);
			} else {
				handle = fileEmitter({
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
		url.searchParams.append('origWidth', fileMetadata.width.toString());
		url.searchParams.append('origHeight', fileMetadata.height.toString());
		url.searchParams.append('origFormat', fileMetadata.format);
		emittedImage.src = `/@fs` + prependForwardSlash(fileURLToNormalizedPath(url));
	}
	return emittedImage;
}
function fileURLToNormalizedPath(filePath) {
	return slash(fileURLToPath(filePath) + filePath.search).replace(/\\/g, '/');
}
export { emitImageMetadata, hashTransform, propsToFilename };
