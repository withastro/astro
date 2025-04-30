import { readFileSync } from 'node:fs';
import type { ErrorHandler, FontFileReader } from '../definitions.js';
import { fontace } from 'fontace';
import type { Style } from '../types.js';

export function createFontaceFontFileReader({
	errorHandler,
}: { errorHandler: ErrorHandler }): FontFileReader {
	return {
		extract({ family, url }) {
			try {
				const data = fontace(readFileSync(url));
				return {
					weight: data.weight as string,
					style: data.style as Style,
					unicodeRange: data.unicodeRange.split(',').map((v) => v.trim()),
				};
			} catch (cause) {
				throw errorHandler.handle({
					type: 'cannot-extract-data',
					data: { family, url },
					cause,
				});
			}
		},
	};
}
