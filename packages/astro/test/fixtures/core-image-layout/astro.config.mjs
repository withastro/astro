//  @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  image: {
      experimentalLayout: 'constrained',
	},

  experimental: {
      responsiveImages: true
	},
});
