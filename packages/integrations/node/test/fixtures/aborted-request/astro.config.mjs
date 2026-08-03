import { defineConfig, logHandlers } from 'astro/config';

export default defineConfig({
	logger: logHandlers.json(),
});
