export { default, cli } from './dist/index.js';

declare module 'astro:db' {
	export { defineTable, defineDB, column, sql, NOW, TRUE, FALSE } from './dist/index.js';
}
