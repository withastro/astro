import { db, sql } from 'astro:db';
import type { APIRoute } from 'astro';
import { AstrojsWebVitals_Metric } from './db-config.js';
import { ServerMetricSchema } from './schemas.js';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	try {
		const rawBody = await request.json();
		const body = ServerMetricSchema.array().parse(rawBody);
		await db
			.insert(AstrojsWebVitals_Metric)
			.values(body)
			.onConflictDoUpdate({
				target: AstrojsWebVitals_Metric.id,
				set: { value: sql`excluded.value` },
			});
	} catch (error) {
		console.error(error);
	}
	return new Response();
};
