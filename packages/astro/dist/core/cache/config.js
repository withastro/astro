import * as z from 'zod/v4';
const CacheProviderConfigSchema = z.object({
	config: z.record(z.string(), z.any()).optional(),
	entrypoint: z.union([z.string(), z.instanceof(URL)]),
	name: z.string().optional(),
});
const CacheOptionsSchema = z.object({
	maxAge: z.number().int().min(0).optional(),
	swr: z.number().int().min(0).optional(),
	tags: z.array(z.string()).optional(),
});
const CacheSchema = z.object({
	provider: CacheProviderConfigSchema.optional(),
});
const RouteRuleSchema = CacheOptionsSchema;
const RouteRulesSchema = z.record(z.string(), RouteRuleSchema);
export { CacheSchema, RouteRulesSchema };
