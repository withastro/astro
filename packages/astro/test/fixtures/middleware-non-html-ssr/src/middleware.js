import { defineMiddleware, sequence } from 'astro:middleware';
import { promises as fs } from 'node:fs';

const first = defineMiddleware(async (context, next) => {
	if (context.request.url.includes('/placeholder.png')) {
		const buffer = await fs.readFile('./test/fixtures/non-html-pages/src/images/placeholder.png');
		return new Response(buffer.buffer, {
			headers: {
				"Content-Type": "image/png",
				"Content-Disposition": `inline; filename="placeholder.png"`,
			},
		});
	} else if (context.request.url.includes('/rename-me.json')) {
		const content = JSON.stringify({name: "alan"})
		return new Response(content, {
			headers: {
				"Content-Type": "application/json",
				"Content-Disposition": `inline; filename="data.json"`,
			},
		});
	}

	return next();
});

export const onRequest = sequence(
	first
);
