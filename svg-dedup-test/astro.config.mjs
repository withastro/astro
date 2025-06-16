import { defineConfig } from 'astro/config';

export default defineConfig({
  // Enable build optimizations to test deduplication
  build: {
    // Enable asset inlining for smaller assets
    assetsInlineLimit: 0, // Force all assets to be emitted as separate files
  }
});
