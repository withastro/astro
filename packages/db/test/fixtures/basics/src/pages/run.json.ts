/// <reference types="@astrojs/db" />
import type { APIRoute } from 'astro';
import { db, sql } from 'astro:db';

export const GET: APIRoute = async () => {
	const authors = await db.run(sql`SELECT * FROM Author`);
	return new Response(JSON.stringify(authors), {
		headers: {
			'content-type': 'application/json',
		},
	});
};
