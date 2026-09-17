declare module 'virtual:@astrojs/sqlite/client' {
	export function getClient(): Promise<import('./runtime/types.js').SqliteClient>;
	export const tablePrefix: string;
}

declare module 'cloudflare:workers' {
	export const env: Record<string, unknown>;
}
