declare module 'astro:db' {
	export const sql: typeof import('./dist/runtime/config.js').sql;
	export const NOW: typeof import('./dist/runtime/config.js').NOW;
	export const TRUE: typeof import('./dist/runtime/config.js').TRUE;
	export const FALSE: typeof import('./dist/runtime/config.js').FALSE;
	export const column: typeof import('./dist/runtime/config.js').column;
	export const defineDB: typeof import('./dist/runtime/config.js').defineDB;
	export const defineTable: typeof import('./dist/runtime/config.js').defineTable;
}
