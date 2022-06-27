export async function loadEnv() {
	const { loadEnv: loadViteEnv } = await import('vite');
	const { MODE } = process.env;
	const PROD = MODE === 'production';
	const env = loadViteEnv(MODE, process.cwd(), '');
	return { ...env, MODE, DEV: !PROD, PROD };
}

export function defineConfig(config) {
	return config;
}
