import { defineConfig } from 'astro/config';

export default defineConfig({
	vite: {
		build: {
				rollupOptions: {
						output: {
								chunkFileNames: 'assets/testing-[name].js',
								assetFileNames: 'assets/testing-[name].[ext]'
						}
				}
		}
	}
})
