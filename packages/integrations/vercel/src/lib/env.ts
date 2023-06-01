/**
 * While Vercel adds the `PUBLIC_` prefix for their `VERCEL_` env vars by default, some env vars
 * like `VERCEL_ANALYTICS_ID` aren't, so handle them here so that it works correctly in runtime.
 */
export function exposeEnv(envs: string[]): Record<string, unknown> {
	const mapped: Record<string, unknown> = {};

	envs
		.filter((env) => process.env[env])
		.forEach((env) => {
			mapped[`import.meta.env.PUBLIC_${env}`] = JSON.stringify(process.env[env]);
		});

	return mapped;
}
