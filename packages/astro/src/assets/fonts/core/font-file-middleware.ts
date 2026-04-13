import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AstroLogger } from '../../../core/logger/core.js';
import type { FontFetcher, FontTypeExtractor } from '../definitions.js';
import type { FontFileById } from '../types.js';
import { isAstroError } from '../../../core/errors/errors.js';
import { formatErrorMessage } from '../../../core/messages/runtime.js';
import { collectErrorMetadata } from '../../../core/errors/dev/utils.js';

interface Options {
	req: IncomingMessage;
	res: ServerResponse<IncomingMessage>;
	next: () => void;
	fontFetcher: FontFetcher | null;
	fontTypeExtractor: FontTypeExtractor | null;
	logger: AstroLogger;
	fontFileById: FontFileById | null;
}

// TODO: test
export async function fontFileMiddleware({
	req,
	res,
	next,
	fontFetcher,
	fontTypeExtractor,
	logger,
	fontFileById,
}: Options): Promise<void> {
	if (!fontFetcher || !fontTypeExtractor) {
		logger.debug('assets', 'Fonts dependencies should be initialized by now, skipping middleware.');
		return next();
	}
	if (!req.url) {
		return next();
	}
	const fontId = req.url.slice(1);
	const fontData = fontFileById?.get(fontId);
	if (!fontData) {
		return next();
	}
	// We don't want the request to be cached in dev because we cache it already internally,
	// and it makes it easier to debug without needing hard refreshes
	res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', 0);

	try {
		const buffer = await fontFetcher.fetch({ id: fontId, ...fontData });

		res.setHeader('Content-Length', buffer.byteLength);
		res.setHeader('Content-Type', `font/${fontTypeExtractor.extract(fontId)}`);

		res.end(buffer);
	} catch (err) {
		logger.error('assets', 'Cannot download font file');
		if (isAstroError(err)) {
			logger.error(
				'SKIP_FORMAT',
				formatErrorMessage(collectErrorMetadata(err), logger.level() === 'debug'),
			);
		}
		res.statusCode = 500;
		res.end();
	}
}
