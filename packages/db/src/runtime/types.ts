import type { ColumnBaseConfig, ColumnDataType } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import type { ColumnsConfig, DBColumn, OutputColumnsConfig } from '../core/types.js';

type GeneratedConfig<T extends ColumnDataType = ColumnDataType> = Pick<
	ColumnBaseConfig<T, string>,
	'name' | 'tableName' | 'notNull' | 'hasDefault' | 'hasRuntimeDefault' | 'isPrimaryKey'
>;

type AstroText<
	T extends GeneratedConfig<'string'>,
	D extends [string, ...string[]] | never,
> = SQLiteColumn<
	T & {
		data: D extends [string, ...string[]] ? D[number] : string;
		dataType: 'string';
		columnType: 'SQLiteText';
		driverParam: string;
		enumValues: D extends [string, ...string[]] ? D : never;
		baseColumn: never;
		isAutoincrement: boolean;
		identity: undefined;
		generated: undefined;
	}
>;

type AstroDate<T extends GeneratedConfig<'custom'>> = SQLiteColumn<
	T & {
		data: Date;
		dataType: 'custom';
		columnType: 'SQLiteCustomColumn';
		driverParam: string;
		enumValues: never;
		baseColumn: never;
		isAutoincrement: boolean;
		identity: undefined;
		generated: undefined;
	}
>;

type AstroBoolean<T extends GeneratedConfig<'boolean'>> = SQLiteColumn<
	T & {
		data: boolean;
		dataType: 'boolean';
		columnType: 'SQLiteBoolean';
		driverParam: number;
		enumValues: never;
		baseColumn: never;
		isAutoincrement: boolean;
		identity: undefined;
		generated: undefined;
	}
>;

type AstroNumber<T extends GeneratedConfig<'number'>> = SQLiteColumn<
	T & {
		data: number;
		dataType: 'number';
		columnType: 'SQLiteInteger';
		driverParam: number;
		enumValues: never;
		baseColumn: never;
		isAutoincrement: boolean;
		identity: undefined;
		generated: undefined;
	}
>;

type AstroJson<T extends GeneratedConfig<'custom'>> = SQLiteColumn<
	T & {
		data: unknown;
		dataType: 'custom';
		columnType: 'SQLiteCustomColumn';
		driverParam: string;
		enumValues: never;
		baseColumn: never;
		isAutoincrement: boolean;
		identity: undefined;
		generated: undefined;
	}
>;

type Column<
	T extends DBColumn['type'],
	S extends [string, ...string[]] | never,
	G extends GeneratedConfig,
> = T extends 'boolean'
	? AstroBoolean<G>
	: T extends 'number'
		? AstroNumber<G>
		: T extends 'text'
			? AstroText<G, S extends infer S ? (S extends [string, ...string[]] ? S : never) : never>
			: T extends 'date'
				? AstroDate<G>
				: T extends 'json'
					? AstroJson<G>
					: never;

export type Table<
	TTableName extends string,
	TColumns extends OutputColumnsConfig | ColumnsConfig,
> = SQLiteTableWithColumns<{
	name: TTableName;
	schema: undefined;
	dialect: 'sqlite';
	columns: {
		[K in Extract<keyof TColumns, string>]: Column<
			TColumns[K]['type'],
			TColumns[K]['schema'] extends { enum: [string, ...string[]] }
				? TColumns[K]['schema']['enum']
				: never,
			{
				tableName: TTableName;
				name: K;
				isPrimaryKey: TColumns[K]['schema'] extends { primaryKey: true } ? true : false;
				hasDefault: TColumns[K]['schema'] extends { default: NonNullable<unknown> }
					? true
					: TColumns[K]['schema'] extends { primaryKey: true }
						? true
						: false;
				hasRuntimeDefault: TColumns[K]['schema'] extends { default: NonNullable<unknown> }
					? true
					: false;
				notNull: TColumns[K]['schema']['optional'] extends true ? false : true;
			}
		>;
	};
}>;

export const SERIALIZED_SQL_KEY = '__serializedSQL';
export type SerializedSQL = {
	[SERIALIZED_SQL_KEY]: true;
	sql: string;
};

export function isSerializedSQL(value: any): value is SerializedSQL {
	return typeof value === 'object' && value !== null && SERIALIZED_SQL_KEY in value;
}
