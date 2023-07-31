import type { NodeApp } from 'astro/app/node';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Readable } from 'stream';
import { createOutgoingHttpHeaders } from './createOutgoingHttpHeaders';
import { responseIterator } from './response-iterator';
import type { Options } from './types';

// Disable no-unused-vars to avoid breaking signature change
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function (app: NodeApp, _mode: Options['mode']) {
	return async function (
		req: IncomingMessage,
		res: ServerResponse,
		next?: (err?: unknown) => void,
		locals?: object
	) {
		try {
			const route = app.match(req);
			if (route) {
				try {
					const response = await app.render(req, route, locals);
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
				const response = await app.render(req);
				await writeWebResponse(app, res, response);
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
			for (const setCookieHeader of setCookieHeaders) {
				webResponse.headers.append('set-cookie', setCookieHeader);
			}
		}
	}

	const nodeHeaders = createOutgoingHttpHeaders(headers);
	res.writeHead(status, nodeHeaders);
	if (webResponse.body) {
		try {
			for await (const chunk of responseIterator(webResponse) as unknown as Readable) {
				res.write(chunk);
			}
		} catch (err: any) {
			console.error(err?.stack || err?.message || String(err));
			res.write('Internal server error');
		}
	}
	res.end();
}
