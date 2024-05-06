import { z } from 'astro/zod';

export const RatingSchema = z.enum(['good', 'needs-improvement', 'poor']);
const MetricTypeSchema = z.enum(['CLS', 'INP', 'LCP', 'FCP', 'FID', 'TTFB']);

/** `web-vitals` generated ID, transformed to reduce data resolution. */
const MetricIdSchema = z
	.string()
	// Match https://github.com/GoogleChrome/web-vitals/blob/main/src/lib/generateUniqueID.ts
	.regex(/^v3-\d{13}-\d{13}$/)
	// Avoid collecting higher resolution timestamp in ID.
	// Transforms `'v3-1711484350895-3748043125387'` to `'v3-17114843-3748043125387'`
	.transform((id) => id.replace(/^(v3-\d{8})\d{5}(-\d{13})$/, '$1$2'));

/** Shape of the data submitted from clients to the collection API. */
const ClientMetricSchema = z.object({
	pathname: z.string(),
	route: z.string(),
	name: MetricTypeSchema,
	id: MetricIdSchema,
	value: z.number().gte(0),
	rating: RatingSchema,
});

/** Transformed client data with added timestamp. */
export const ServerMetricSchema = ClientMetricSchema.transform((metric) => {
	const timestamp = new Date();
	timestamp.setMinutes(0, 0, 0);
	return { ...metric, timestamp };
});

export type ClientMetric = z.input<typeof ClientMetricSchema>;
