import type { NodeApp } from 'astro/app/node';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Readable } from 'stream';
import { responseIterator } from './response-iterator';
import type { Options } from './types';

export default function (app: NodeApp, mode: Options['mode']) {
	return async function (
		req: IncomingMessage,
		res: ServerResponse,
		next?: (err?: unknown) => void
	) {
		try {
			const route =
				mode === 'standalone' ? app.match(req, { matchNotFound: true }) : app.match(req);
			if (route) {
				try {
					const response = await app.render(req);
					await writeWebResponse(app, res, response);
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
				res.writeHead(404);
				res.end('Not found');
			}
		} catch (err: unknown) {
			if (!res.headersSent) {
				res.writeHead(500, `Server error`);
				res.end();
			}
		}
	};
}

async function writeWebResponse(app: NodeApp, res: ServerResponse, webResponse: Response) {
	const { status, headers } = webResponse;

	if (app.setCookieHeaders) {
		const setCookieHeaders: Array<string> = Array.from(app.setCookieHeaders(webResponse));
		if (setCookieHeaders.length) {
			res.setHeader('Set-Cookie', setCookieHeaders);
		}
	}

	res.writeHead(status, Object.fromEntries(headers.entries()));
	if (webResponse.body) {
		for await (const chunk of responseIterator(webResponse) as unknown as Readable) {
			res.write(chunk);
		}
	}
	res.end();
}
