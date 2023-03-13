import type { AstroConfig } from 'astro';
import type { Route as VercelRoute } from '@vercel/routing-utils';
import * as fs from "node:fs/promises";
import { getTransformedRoutes } from '@vercel/routing-utils';

export async function getRoutesFromVercelJSON(config: AstroConfig): Promise<VercelRoute[]> {
	let vercelConfig: Record<string, any> | undefined;
	try {
		vercelConfig = await fs.readFile(new URL('./vercel.json', config.root), { encoding: 'utf-8' }).then(res => JSON.parse(res));
	} catch (e) {}

	if (!vercelConfig) return []
	const { routes } = getTransformedRoutes(vercelConfig);
	
	// First route is `filesystem`, which we already inject
	return routes?.slice(1) ?? [];
}
