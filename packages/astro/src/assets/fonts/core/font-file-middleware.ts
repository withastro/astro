import type { AstroLogger } from '../../../core/logger/core.js';
import type { FontFetcher, FontTypeExtractor } from '../definitions.js';
import type { FontFileById } from '../types.js';
import { isAstroError } from '../../../core/errors/errors.js';
import { formatErrorMessage } from '../../../core/messages/runtime.js';
import { collectErrorMetadata } from '../../../core/errors/dev/utils.js';
import type { ServerResponse } from 'node:http';

interface MinimalResponse {
	setHeader: (name: string, value: string) => void;
	end: (buffer?: Buffer) => void;
	setStatusCode: (statusCode: number) => void;
}

interface Options {
	url: string | undefined;
	response: MinimalResponse;
	next: () => void;
	fontFetcher: FontFetcher | null;
	fontTypeExtractor: FontTypeExtractor | null;
	logger: AstroLogger;
	fontFileById: FontFileById | null;
}

export function resToMinimalResponse(res: ServerResponse): MinimalResponse {
	return {
		setHeader: (...args) => res.setHeader(...args),
		end: (...args) => res.end(...args),
		setStatusCode: (statusCode) => {
			res.statusCode = statusCode;
		},
	};
}

export async function fontFileMiddleware({
	url: _url,
	response,
	next,
	fontFetcher,
	fontTypeExtractor,
	logger,
	fontFileById,
}: Options): Promise<void> {
	if (!fontFetcher || !fontTypeExtractor || !fontFileById) {
		logger.debug('assets', 'Fonts dependencies should be initialized by now, skipping middleware.');
		return next();
	}
	if (!_url) {
		return next();
	}
	const url = new URL(_url, 'http://localhost');
	const fontId = url.pathname.slice(1);
	const fontData = fontFileById.get(fontId);
	if (!fontData) {
		return next();
	}
	// We don't want the request to be cached in dev because we cache it already internally,
	// and it makes it easier to debug without needing hard refreshes
	response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
	response.setHeader('Pragma', 'no-cache');
	response.setHeader('Expires', '0');

	try {
		const buffer = await fontFetcher.fetch({ id: fontId, ...fontData });

		response.setHeader('Content-Length', buffer.byteLength.toString());
		response.setHeader('Content-Type', `font/${fontTypeExtractor.extract(fontId)}`);

		response.setStatusCode(200);
		response.end(buffer);
	} catch (err) {
		logger.error('assets', 'Cannot download font file');
		if (isAstroError(err)) {
			logger.error(
				'SKIP_FORMAT',
				formatErrorMessage(collectErrorMetadata(err), logger.level() === 'debug'),
			);
		}
		response.setStatusCode(500);
		response.end();
	}
}
