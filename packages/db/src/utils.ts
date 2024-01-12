import type { AstroConfig } from 'astro';
import { red, yellow } from 'kleur/colors';
import { loadEnv } from 'vite';

export type VitePlugin = Required<AstroConfig['vite']>['plugins'][number];

export function getAstroStudioEnv(envMode = ''): Record<`ASTRO_STUDIO_${string}`, string> {
	const env = loadEnv(envMode, process.cwd(), 'ASTRO_STUDIO_');
	return env;
}

export async function isAppTokenValid({
	remoteDbUrl,
	appToken,
}: {
	remoteDbUrl: string;
	appToken: string;
}): Promise<boolean> {
	const { status } = await fetch(new URL('/authorize', remoteDbUrl), {
		headers: {
			Authorization: `Bearer ${appToken}`,
		},
	});

	if (status === 200) {
		return true;
	} else if (status === 401) {
		// eslint-disable-next-line no-console
		console.warn(yellow(`⚠️ App token is invalid or revoked.`));
		return false;
	} else {
		// eslint-disable-next-line no-console
		console.error(
			`${red('⚠️ Unexpected error connecting to Astro Studio.')} Please try again later.`,
		);
		process.exit(1);
	}
}

export function getStudioUrl(): string {
	const env = getAstroStudioEnv();
	return env.ASTRO_STUDIO_BASE_URL;
}

export function getRemoteDatabaseUrl(): string {
	const env = getAstroStudioEnv();
	return env.ASTRO_STUDIO_REMOTE_DB_URL;
}
