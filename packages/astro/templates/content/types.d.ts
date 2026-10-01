declare module 'astro:content' {
	export type ContentConfig = '@@CONTENT_CONFIG_TYPE@@';
	export type LiveContentConfig = '@@LIVE_CONTENT_CONFIG_TYPE@@';

	export interface DataMap {
		// @@DATA_MAP@@
	}

	export interface LiveDataMap /* @@LIVE_DATA_MAP_BASE@@ */ {}
}
