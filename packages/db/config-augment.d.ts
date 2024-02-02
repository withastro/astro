declare namespace Config {
	type DBUserConfig = import('./dist/core/types.js').DBUserConfig;
	export interface Database extends DBUserConfig {}
}

declare module 'astro:db' {
	export const db: import('./dist/runtime/index.js').SqliteDB;
	export const dbUrl: string;

	export {
		sql,
		eq,
		gt,
		gte,
		lt,
		lte,
		ne,
		isNull,
		isNotNull,
		inArray,
		notInArray,
		exists,
		notExists,
		between,
		notBetween,
		like,
		notIlike,
		not,
		asc,
		desc,
		and,
		or,
	} from 'drizzle-orm';
}
