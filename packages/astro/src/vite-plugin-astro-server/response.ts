import type http from 'node:http';
import { redirectTemplate } from '../core/routing/3xx.js';

export function writeHtmlResponse(res: http.ServerResponse, statusCode: number, html: string) {
	res.writeHead(statusCode, {
		'Content-Type': 'text/html',
		'Content-Length': Buffer.byteLength(html, 'utf-8'),
	});
	res.write(html);
	res.end();
}

export function writeRedirectResponse(
	res: http.ServerResponse,
	statusCode: number,
	location: string,
) {
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
