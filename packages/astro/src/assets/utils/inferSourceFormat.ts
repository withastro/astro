import { removeQueryString } from '@astrojs/internal-helpers/path';

const DATA_PREFIX = 'data:';

/**
 * Infer the image format from a source path or URL by examining
 * the file extension. For data: URIs, the MIME type is extracted.
 * Returns undefined if the format cannot be determined.
 */
export function inferSourceFormat(src: string): string | undefined {
	// data: URIs encode the MIME type directly, e.g. "data:image/svg+xml;base64,..."
	if (src.startsWith(DATA_PREFIX)) {
		const mime = src.slice(DATA_PREFIX.length, src.indexOf(';'));
		if (mime === 'image/svg+xml') return 'svg';
		const sub = mime.split('/')[1];
		return sub || undefined;
	}

	// For regular URLs/paths, extract the extension from the pathname
	try {
		// Strip query string and hash before extracting extension
		const cleanSrc = removeQueryString(src).split('#')[0];
		const lastDot = cleanSrc.lastIndexOf('.');
		if (lastDot === -1) return undefined;
		return cleanSrc.slice(lastDot + 1).toLowerCase();
	} catch {
		return undefined;
	}
}
