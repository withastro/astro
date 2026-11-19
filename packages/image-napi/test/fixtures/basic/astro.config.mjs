import { napiImageService } from '@astrojs/image-napi';
import { defineConfig } from 'astro/config';

export default defineConfig({
	image: { service: napiImageService() },
});
