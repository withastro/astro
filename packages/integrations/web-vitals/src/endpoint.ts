import type { APIRoute } from 'astro';
import { db, AstrojsWebVitals_Metric as Metric, sql } from 'astro:db';
import { ServerMetricSchema } from './schemas.js';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	try {
		const rawBody = await request.json();
		const body = ServerMetricSchema.array().parse(rawBody);
		await db
			.insert(Metric)
			.values(body)
			.onConflictDoUpdate({ target: Metric.id, set: { value: sql`excluded.value` } });
	} catch (error) {
		console.error(error);
	}
	return new Response();
};
