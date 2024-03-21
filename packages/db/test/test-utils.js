import { createClient } from '@libsql/client';
import { createServer } from 'node:http';
import { z } from 'zod';

const singleQuerySchema = z.object({
	sql: z.string(),
	args: z.array(z.any()).or(z.record(z.string(), z.any())),
});

const querySchema = singleQuerySchema.or(z.array(singleQuerySchema));

export function createProxyServer() {
	const client = createClient({
		url: ':memory:',
	});
	const server = createServer((req, res) => {
		if (
			!req.url.startsWith('/db/query') ||
			req.method !== 'POST' ||
			req.headers['content-type'] !== 'application/json'
		) {
			res.writeHead(404, { 'Content-Type': 'application/json' });
			res.end(
				JSON.stringify({
					success: false,
				})
			);
			return;
		}
		const rawBody = [];
		req.on('data', (chunk) => {
			rawBody.push(chunk);
		});
		req.on('end', async () => {
			let json;
			try {
				json = JSON.parse(Buffer.concat(rawBody).toString());
			} catch (e) {
				applyParseError(res);
				return;
			}
			const parsed = querySchema.safeParse(json);
			if (parsed.success === false) {
				applyParseError(res);
				return;
			}
			const body = parsed.data;
			try {
				const result = Array.isArray(body) ? await client.batch(body) : await client.execute(body);
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(result));
			} catch (e) {
				res.writeHead(500, { 'Content-Type': 'application/json' });
				res.statusMessage = e.message;
				res.end(
					JSON.stringify({
						success: false,
						message: e.message,
					})
				);
			}
		});
	});

	return server;
}

function applyParseError(res) {
	res.writeHead(400, { 'Content-Type': 'application/json' });
	res.statusMessage = 'Invalid request body';
	res.end(
		JSON.stringify({
			// Use JSON response with `success: boolean` property
			// to match remote error responses.
			success: false,
		})
	);
}
