import { readFileSync } from 'node:fs';
import { fontace } from 'fontace';
import type { ErrorHandler, FontFileReader } from '../definitions.js';
import type { Style } from '../types.js';

export function createFontaceFontFileReader({
	errorHandler,
}: {
	errorHandler: ErrorHandler;
}): FontFileReader {
	return {
		extract({ family, url }) {
			try {
				const data = fontace(readFileSync(url));
				return {
					weight: data.weight,
					style: data.style as Style,
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
