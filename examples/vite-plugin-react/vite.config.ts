import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import type { AstroIntegration } from 'astro';
import { astro } from 'astro/vite';
import { defineConfig } from 'vite';

// Logs integration hooks to show which ones run under plain Vite.
const hookLogger: AstroIntegration = {
	name: 'hook-logger',
	hooks: Object.fromEntries(
		[
			'astro:config:setup',
			'astro:config:done',
			'astro:routes:resolved',
			'astro:server:setup',
			'astro:server:start',
			'astro:server:done',
			'astro:build:start',
			'astro:build:setup',
			'astro:build:generated',
			'astro:build:done',
		].map((hook) => [
			hook,
			(opts: any) => opts.logger.info(`${hook}${'command' in opts ? ` (${opts.command})` : ''}`),
		]),
	),
};

export default defineConfig({
	plugins: [astro({ integrations: [react(), hookLogger] }), tailwindcss()],
});
