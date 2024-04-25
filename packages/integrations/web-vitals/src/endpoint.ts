import { asDrizzleTable } from '@astrojs/db/runtime';
import type { APIRoute } from 'astro';
import { AstrojsWebVitals_Metric } from './db-config.js';
import { ServerMetricSchema } from './schemas.js';
import { db, sql } from 'astro:db';

export const prerender = false;
const Metric = asDrizzleTable('AstrojsWebVitals_Metric', AstrojsWebVitals_Metric);

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
