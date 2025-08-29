import { defineConfig } from 'astro/config';

export default defineConfig({
	// Enable tracing and middleware for testing
	experimental: {
		// Any experimental features needed for tracing
	},
	// Configure for testing environment
	server: {
		port: 4321,
	},
});
