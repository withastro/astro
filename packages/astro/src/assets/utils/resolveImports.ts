import { resolve } from 'node:path/posix';
import { CONTENT_IMAGE_FLAG, IMAGE_IMPORT_PREFIX } from '../../content/consts.js';
import { shorthash } from '../../runtime/server/shorthash.js';
import { VALID_INPUT_FORMATS } from '../consts.js';

/**
 * Resolves an image src from a content file (such as markdown) to an import id.
 * @param imageSrc The src attribute of an image tag
 * @param filePath The path to the file that contains the image
 * @returns The import id of the image, or undefined if it is not a local image
 */
export function imageSrcToImportId(imageSrc: string, filePath: string): string | undefined {
	// If the import is coming from the data store it will have a special prefix to identify it
	// as an image import. We remove this prefix so that we can resolve the image correctly.
	if (imageSrc.startsWith(IMAGE_IMPORT_PREFIX)) {
		imageSrc = imageSrc.slice(IMAGE_IMPORT_PREFIX.length);
	}

	// We only care about local imports
	if (['http', 'https'].includes(imageSrc.split(':')[0]) || imageSrc.startsWith('/')) {
		return;
	}
	// We only care about images
	const ext = imageSrc.split('.').at(-1) as (typeof VALID_INPUT_FORMATS)[number] | undefined;
	if (!ext || !VALID_INPUT_FORMATS.includes(ext)) {
		return;
	}
	// If the import is relative, we can resolve it here
	if (imageSrc.startsWith('./') || imageSrc.startsWith('../')) {
		return resolve(filePath, '..', imageSrc);
	}
	// Otherwise we need to resolve it with Vite. We set the importer to the current file so
	// that Vite can resolve it correctly.
	const params = new URLSearchParams(CONTENT_IMAGE_FLAG);
	params.set('importer', filePath);
	return `${imageSrc}?${params.toString()}`;
}

export const importIdToSymbolName = (importId: string) =>
	`__ASTRO_IMAGE_IMPORT_${shorthash(importId)}`;
