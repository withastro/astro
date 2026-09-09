/// <reference types="vitest/config" />

import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { getViteConfig } from 'astro/config';

export default getViteConfig(
	{
		plugins: [
			cloudflareTest(async () => ({
				main: './src/testWorker.ts',
				wrangler: { configPath: './wrangler.jsonc' },
			})),
		],
	},
	{ configFile: false, output: 'server' },
);