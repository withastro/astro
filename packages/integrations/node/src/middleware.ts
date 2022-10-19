import type { NodeApp } from 'astro/app/node';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Readable } from 'stream';

export default function (app: NodeApp) {
	return async function (
		req: IncomingMessage,
		res: ServerResponse,
		next?: (err?: unknown) => void
	) {
		try {
			const route = app.match(req);

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
	const { status, headers, body } = webResponse;

	if (app.setCookieHeaders) {
		const setCookieHeaders: Array<string> = Array.from(app.setCookieHeaders(webResponse));
		if (setCookieHeaders.length) {
			res.setHeader('Set-Cookie', setCookieHeaders);
		}
	}

	res.writeHead(status, Object.fromEntries(headers.entries()));
	if (body) {
		for await (const chunk of body as unknown as Readable) {
			res.write(chunk);
		}
	}
	res.end();
}
