import type { ColumnBaseConfig, ColumnDataType } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import type { ColumnsConfig, DBColumn, OutputColumnsConfig } from '../core/types.js';

type GeneratedConfig<T extends ColumnDataType = ColumnDataType> = Pick<
	ColumnBaseConfig<T, string>,
	| 'name'
	| 'tableName'
	| 'notNull'
	| 'hasDefault'
	| 'hasRuntimeDefault'
	| 'isPrimaryKey'
	| 'enumValues'
	| 'data'
>;

type AstroText<T extends GeneratedConfig<'string'>> = SQLiteColumn<
	T & {
		dataType: 'string';
		columnType: 'SQLiteText';
		driverParam: string;
		baseColumn: never;
		isAutoincrement: boolean;
		identity: undefined;
		generated: undefined;
	}
>;

type AstroDate<T extends GeneratedConfig<'custom'>> = SQLiteColumn<
	T & {
		dataType: 'custom';
		columnType: 'SQLiteCustomColumn';
		driverParam: string;
		baseColumn: never;
		isAutoincrement: boolean;
		identity: undefined;
		generated: undefined;
	}
>;

type AstroBoolean<T extends GeneratedConfig<'boolean'>> = SQLiteColumn<
	T & {
		dataType: 'boolean';
		columnType: 'SQLiteBoolean';
		driverParam: number;
		baseColumn: never;
		isAutoincrement: boolean;
		identity: undefined;
		generated: undefined;
	}
>;

type AstroNumber<T extends GeneratedConfig<'number'>> = SQLiteColumn<
	T & {
		dataType: 'number';
		columnType: 'SQLiteInteger';
		driverParam: number;
		baseColumn: never;
		isAutoincrement: boolean;
		identity: undefined;
		generated: undefined;
	}
>;

type AstroJson<T extends GeneratedConfig<'custom'>> = SQLiteColumn<
	T & {
		dataType: 'custom';
		columnType: 'SQLiteCustomColumn';
		driverParam: string;
		baseColumn: never;
		isAutoincrement: boolean;
		identity: undefined;
		generated: undefined;
	}
>;

type Column<T extends DBColumn['type'], S extends GeneratedConfig> = T extends 'boolean'
	? AstroBoolean<S>
	: T extends 'number'
		? AstroNumber<S>
		: T extends 'text'
			? AstroText<S>
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
		[K in Extract<keyof TColumns, string>]: Column<
			TColumns[K]['type'],
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
				enumValues: TColumns[K]['schema'] extends { enum: infer E }
					? E extends [string, ...string[]]
						? E
						: never
					: never;
				data: TColumns[K]['type'] extends 'boolean'
					? boolean
					: TColumns[K]['type'] extends 'number'
						? number
						: TColumns[K]['type'] extends 'text'
							? TColumns[K]['schema'] extends { enum: infer E }
								? E extends [string, ...string[]]
									? E[number] // Convert tuple to union
									: string
								: string
							: TColumns[K]['type'] extends 'date'
								? Date
								: TColumns[K]['type'] extends 'json'
									? unknown
									: never;
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
