import { defineConfig } from 'cf/config';

export default defineConfig({
	worker: {
		name: 'prerender-nodejs-compat',
		compatibilityDate: '2025-12-01',
		compatibilityFlags: ['nodejs_compat'],
	},
});
