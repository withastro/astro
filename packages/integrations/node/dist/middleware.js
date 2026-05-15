import { createAppHandler } from './serve-app.js';
function createMiddleware(app, options) {
	const handler = createAppHandler(app, options);
	const logger = app.adapterLogger;
	return async (...args) => {
		const [req, res, next, locals] = args;
		if (req instanceof Error) {
			const error = req;
			if (next) {
				return next(error);
			} else {
				throw error;
			}
		}
		try {
			await handler(req, res, next, locals);
		} catch (err) {
			logger.error(`Could not render ${req.url}`);
			console.error(err);
			if (!res.headersSent) {
				res.writeHead(500, `Server error`);
				res.end();
			}
		}
	};
}
export { createMiddleware as default };
