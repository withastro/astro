import { defineConfig } from 'astro/config';
import { z } from 'zod';

// https://astro.build/config
export default defineConfig({
	jsonDataFiles: [
		{
			path: 'src/data.json',
			schema: z.object({
				name: z.string(),
				images: z.array(
					z.object({
						imageSrc: z.string(), // TODO: use an optimized image type
						imageAlt: z.string(),
					})
				),
			}),
		},
	],
});
