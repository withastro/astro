import { loadEnv as loadViteEnv } from 'vite';

export function loadEnv() {
	const { MODE } = process.env;
	const PROD = MODE === 'production';
	const env = loadViteEnv(MODE, process.cwd(), '');
	return { ...env, MODE, DEV: !PROD, PROD };
}

export function defineConfig(config) {
	return config;
}
