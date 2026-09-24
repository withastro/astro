declare module 'virtual:astro-cloudflare:prism' {
	export const bundledLanguages: Record<string, () => Promise<void>>;
}
