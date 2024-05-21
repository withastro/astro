import { loadEnv } from 'vite';

export function getAstroStudioEnv(envMode = ''): Record<`ASTRO_STUDIO_${string}`, string> {
	const env = loadEnv(envMode, process.cwd(), 'ASTRO_STUDIO_');
	return env;
}

export function getPublicAstroStudioEnv(): Record<`PUBLIC_ASTRO_STUDIO_${string}`, string> {
	const env = loadEnv('', process.cwd(), 'PUBLIC_ASTRO_STUDIO_');
	return env;
}

export function getAstroStudioUrl(): string {
	const env = getAstroStudioEnv();
	return env.ASTRO_STUDIO_URL || 'https://studio.astro.build';
}

export function getAstroStudioFileServerUrl(): string {
	const env = getPublicAstroStudioEnv();
	return env.PUBLIC_ASTRO_STUDIO_FILE_SERVER || 'https://studio.astro.build/api/serve_file';
}
