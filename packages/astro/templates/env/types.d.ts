declare module 'astro:env/client' {
	// @@CLIENT@@
}

declare module 'astro:env/server' {
	// @@SERVER@@

	export const getSecret: (key: string) => string | undefined;
}
