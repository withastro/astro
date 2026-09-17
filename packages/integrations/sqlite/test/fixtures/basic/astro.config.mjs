// @ts-check
import sqlite from '@astrojs/sqlite';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [sqlite()],
});
