import { Http2ServerResponse } from 'node:http2';
import { Readable } from 'node:stream';
import { getSetCookiesFromResponse } from '../core/cookies/index.js';
import { getViteErrorPayload } from '../core/errors/dev/index.js';
import { redirectTemplate } from '../core/routing/3xx.js';
async function handle500Response(loader, res, err) {
	res.on('close', async () =>
		setTimeout(async () => loader.webSocketSend(await getViteErrorPayload(err)), 200),
	);
	if (res.headersSent) {
		res.write(`<script type="module" src="/@vite/client"></script>`);
		res.end();
	} else {
		writeHtmlResponse(
			res,
			500,
			`<title>${err.name}</title><script type="module" src="/@vite/client"></script>`,
		);
	}
}
function writeHtmlResponse(res, statusCode, html) {
	res.writeHead(statusCode, {
		'Content-Type': 'text/html',
		'Content-Length': Buffer.byteLength(html, 'utf-8'),
	});
	res.write(html);
	res.end();
}
function writeRedirectResponse(res, statusCode, location) {
	const html = redirectTemplate({
		status: statusCode,
		absoluteLocation: location,
		relativeLocation: location,
	});
	res.writeHead(statusCode, {
		Location: location,
		'Content-Type': 'text/html',
		'Content-Length': Buffer.byteLength(html, 'utf-8'),
	});
	res.write(html);
	res.end();
}
async function writeWebResponse(res, webResponse) {
	const { status, headers, body, statusText } = webResponse;
	const setCookiesFromResponse = Array.from(getSetCookiesFromResponse(webResponse));
	const setCookieHeaders = [...setCookiesFromResponse, ...headers.getSetCookie()];
	const _headers = Object.fromEntries(headers.entries());
	if (setCookieHeaders.length) {
		_headers['set-cookie'] = setCookieHeaders;
	}
	if (!(res instanceof Http2ServerResponse)) {
		res.statusMessage = statusText;
	}
	res.writeHead(status, _headers);
	if (body) {
		if (/* @__PURE__ */ Symbol.for('astro.responseBody') in webResponse) {
			let stream = webResponse[/* @__PURE__ */ Symbol.for('astro.responseBody')];
			for await (const chunk of stream) {
				res.write(chunk.toString());
			}
		} else if (body instanceof Readable) {
			body.pipe(res);
			return;
		} else if (typeof body === 'string') {
			res.write(body);
		} else {
			const reader = body.getReader();
			res.on('close', () => {
				reader.cancel().catch(() => {});
			});
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (value) {
					res.write(value);
				}
			}
		}
	}
	res.end();
}
async function writeSSRResult(webRequest, webResponse, res) {
	Reflect.set(webRequest, /* @__PURE__ */ Symbol.for('astro.responseSent'), true);
	return writeWebResponse(res, webResponse);
}
export { handle500Response, writeHtmlResponse, writeRedirectResponse, writeSSRResult };
