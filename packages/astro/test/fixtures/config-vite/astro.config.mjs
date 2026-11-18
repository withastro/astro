import { defineConfig } from 'astro/config';

export default defineConfig({
	vite: {
		environments: {
			prerender: {
				build: {
						rolldownOptions: {
								output: {
										chunkFileNames: 'assets/testing-[name].mjs',
										assetFileNames: 'assets/testing-[name].[ext]'
								}
						}
				}
			}
		}
	}
})
