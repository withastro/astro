import { removeQueryString } from '@astrojs/internal-helpers/path';
import { DEFAULT_OUTPUT_FORMAT } from '../consts.js';

const DATA_PREFIX = 'data:';

/**
 * Infer the image format from a source path or URL.
 *
 * For `data:` URIs the MIME is read up to the first `;` or `,` (whichever comes first),
 * so both `data:image/svg+xml;base64,...` and `data:image/svg+xml,<svg>...` work.
 * `image/svg+xml` normalizes to `svg`; otherwise the subtype after the slash is returned.
 *
 * Returns undefined when the format cannot be determined.
 */
export function inferSourceFormat(src: string): string | undefined {
	// data: URIs encode the MIME type directly, e.g. "data:image/svg+xml;base64,..."
	// or "data:image/svg+xml,<svg>...</svg>" (no media-type parameter).
	if (src.startsWith(DATA_PREFIX)) {
		const sepIndex = src.indexOf(';');
		const commaIndex = src.indexOf(',');
		const mimeEnd =
			sepIndex === -1 ? commaIndex : commaIndex === -1 ? sepIndex : Math.min(sepIndex, commaIndex);
		if (mimeEnd === -1) return undefined;
		const mime = src.slice(DATA_PREFIX.length, mimeEnd);
		if (mime === 'image/svg+xml') return 'svg';
		const sub = mime.split('/')[1];
		return sub || undefined;
	}

	// For regular URLs/paths, extract the extension from the last path segment only.
	// Looking at the whole string would treat dots in hostnames (`example.com`) as extensions.
	try {
		const cleanSrc = removeQueryString(src).split('#')[0];
		const lastSlash = cleanSrc.lastIndexOf('/');
		const basename = lastSlash === -1 ? cleanSrc : cleanSrc.slice(lastSlash + 1);
		const lastDot = basename.lastIndexOf('.');
		if (lastDot === -1) return undefined;
		return basename.slice(lastDot + 1).toLowerCase();
	} catch {
		return undefined;
	}
}

export function resolveDefaultOutputFormat(sourceFormat: string | undefined): string {
	return sourceFormat === 'svg' ? 'svg' : DEFAULT_OUTPUT_FORMAT;
}
