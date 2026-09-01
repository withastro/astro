declare module 'astro:content' {
	export type ContentConfig = '@@CONTENT_CONFIG_TYPE@@';
	export type LiveContentConfig = '@@LIVE_CONTENT_CONFIG_TYPE@@';

	interface DataMap {@@DATA_MAP@@}

	interface LiveDataMap@@LIVE_DATA_MAP_BASE@@ {}
}
