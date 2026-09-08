//  @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  image: {
    layout: 'constrained',
    responsiveStyles: true,
    domains: ['images.unsplash.com'],
  },
});
