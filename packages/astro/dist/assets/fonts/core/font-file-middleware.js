import { isAstroError } from '../../../core/errors/errors.js';
import { formatErrorMessage } from '../../../core/messages/runtime.js';
import { collectErrorMetadata } from '../../../core/errors/dev/utils.js';
function resToMinimalResponse(res) {
	return {
		setHeader: (...args) => res.setHeader(...args),
		end: (...args) => res.end(...args),
		setStatusCode: (statusCode) => {
			res.statusCode = statusCode;
		},
	};
}
async function fontFileMiddleware({
	url: _url,
	response,
	next,
	fontFetcher,
	fontTypeExtractor,
	logger,
	fontFileById,
}) {
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
export { fontFileMiddleware, resToMinimalResponse };
