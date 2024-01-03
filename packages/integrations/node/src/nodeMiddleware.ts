import type { NodeApp } from 'astro/app/node';
import type { ServerResponse } from 'node:http';
import { createOutgoingHttpHeaders } from './createOutgoingHttpHeaders.js';
import type { ErrorHandlerParams, Options, RequestHandlerParams } from './types.js';
import type { AstroIntegrationLogger } from 'astro';
import { Readable } from 'node:stream';

// Disable no-unused-vars to avoid breaking signature change
export default function (app: NodeApp, mode: Options['mode']) {
	return async function (...args: RequestHandlerParams | ErrorHandlerParams) {
		let error = null;
		let locals;
		let [req, res, next] = args as RequestHandlerParams;
		if (mode === 'middleware') {
			let { [3]: _locals } = args;
			locals = _locals;
		}

		if (args[0] instanceof Error) {
			[error, req, res, next] = args as ErrorHandlerParams;
			if (mode === 'middleware') {
				let { [4]: _locals } = args as ErrorHandlerParams;
				locals = _locals;
			}
			if (error) {
				if (next) {
					return next(error);
				} else {
					throw error;
				}
			}
		}

		const logger = app.getAdapterLogger();

		try {
			const routeData = app.match(req);
			if (routeData) {
				try {
					const response = await app.render(req, { routeData, locals });
					await writeWebResponse(app, res, response, logger);
				} catch (err: unknown) {
					if (next) {
						next(err);
					} else {
						throw err;
					}
				}
			} else if (next) {
				return next();
			} else {
				const response = await app.render(req);
				await writeWebResponse(app, res, response, logger);
			}
		} catch (err: unknown) {
			logger.error(`Could not render ${req.url}`);
			console.error(err);
			if (!res.headersSent) {
				res.writeHead(500, `Server error`);
				res.end();
			}
		}
	};
}

async function writeWebResponse(
	app: NodeApp,
	res: ServerResponse,
	webResponse: Response,
	logger: AstroIntegrationLogger
) {
	const { status, headers, body } = webResponse;

	if (app.setCookieHeaders) {
		const setCookieHeaders: Array<string> = Array.from(app.setCookieHeaders(webResponse));

		if (setCookieHeaders.length) {
			for (const setCookieHeader of setCookieHeaders) {
				headers.append('set-cookie', setCookieHeader);
			}
		}
	}

	const nodeHeaders = createOutgoingHttpHeaders(headers);
	res.writeHead(status, nodeHeaders);
	if (body) {
		try {
			const ac = new AbortController()
			Readable.fromWeb(body as any, { signal: ac.signal }).pipe(res)
			res.on('close', () => {
				ac.abort()
			})
		} catch {
			res.write('Internal server error');
		}
	}
	else {
		res.end();
	}
}
