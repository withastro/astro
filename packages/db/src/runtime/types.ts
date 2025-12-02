import type { ColumnBaseConfig, ColumnDataType } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import type { ColumnsConfig, DBColumn, OutputColumnsConfig } from '../core/types.js';

type GeneratedConfig<T extends ColumnDataType = ColumnDataType> = Pick<
	ColumnBaseConfig<T, string>,
	'name' | 'tableName' | 'notNull' | 'hasDefault' | 'hasRuntimeDefault' | 'isPrimaryKey'
>;

type AstroText<
	T extends GeneratedConfig<'string'>,
	E extends readonly [string, ...string[]] | string,
> = SQLiteColumn<
	T & {
		data: E extends readonly (infer U)[] ? U : string;
		dataType: 'string';
		columnType: 'SQLiteText';
		driverParam: string;
		enumValues: E extends [string, ...string[]] ? E : never;
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
	E extends readonly [string, ...string[]] | string,
	S extends GeneratedConfig,
> = T extends 'boolean'
	? AstroBoolean<S>
	: T extends 'number'
		? AstroNumber<S>
		: T extends 'text'
			? AstroText<S, E>
			: T extends 'date'
				? AstroDate<S>
				: T extends 'json'
					? AstroJson<S>
					: never;

export type Table<
	TTableName extends string,
	TColumns extends OutputColumnsConfig | ColumnsConfig,
> = SQLiteTableWithColumns<{
	name: TTableName;
	schema: undefined;
	dialect: 'sqlite';
	columns: {
		[K in Extract<keyof TColumns, string>]: TColumns[K] extends { type: infer T extends string; schema: infer S }
			? S extends { enum: infer E }
				? Column<
						T extends 'number' | 'boolean' | 'date' | 'json' | 'text' ? T : never,
						E extends readonly [string, ...string[]] ? E : string,
						{
							tableName: TTableName;
							name: K;
							isPrimaryKey: S extends { primaryKey: true } ? true : false;
							hasDefault: S extends { default: NonNullable<unknown> }
								? true
								: S extends { primaryKey: true }
									? true
									: false;
							hasRuntimeDefault: S extends { default: NonNullable<unknown> } ? true : false;
							notNull: S extends { optional: true } ? false : true;
						}
					>
				: Column<
						T extends 'number' | 'boolean' | 'date' | 'json' | 'text' ? T : never,
						string,
						{
							tableName: TTableName;
							name: K;
							isPrimaryKey: S extends { primaryKey: true } ? true : false;
							hasDefault: S extends { default: NonNullable<unknown> }
								? true
								: S extends { primaryKey: true }
									? true
									: false;
							hasRuntimeDefault: S extends { default: NonNullable<unknown> } ? true : false;
							notNull: S extends { optional: true } ? false : true;
						}
					>
			: never;
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
