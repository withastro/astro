export function exposeEnv(envs: string[]): Record<string, unknown> {
	const mapped: Record<string, unknown> = {};

	envs
		.filter((env) => process.env[env])
		.forEach((env) => {
			mapped[`import.meta.env.PUBLIC_${env}`] = JSON.stringify(process.env[env]);
		});

	return mapped;
}
