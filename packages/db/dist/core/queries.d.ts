import type {
	BooleanColumn,
	ColumnType,
	DateColumn,
	DBColumn,
	DBTable,
	JsonColumn,
	NumberColumn,
	TextColumn,
} from './types.js';
export declare const SEED_DEV_FILE_NAME: string[];
export declare function getDropTableIfExistsQuery(tableName: string): string;
export declare function getCreateTableQuery(tableName: string, table: DBTable): string;
export declare function getCreateIndexQueries(
	tableName: string,
	table: Pick<DBTable, 'indexes'>,
): string[];
export declare function schemaTypeToSqlType(type: ColumnType): 'text' | 'integer';
export declare function getModifiers(columnName: string, column: DBColumn): string;
export declare function getReferencesConfig(column: DBColumn):
	| {
			type: 'number';
			schema: ({
				unique: boolean;
				deprecated: boolean;
				name?: string | undefined;
				label?: string | undefined;
				collection?: string | undefined;
			} & (
				| {
						primaryKey: false;
						optional: boolean;
						default?: number | import('../runtime/types.js').SerializedSQL | undefined;
				  }
				| {
						primaryKey: true;
						optional?: false | undefined;
						default?: undefined;
				  }
			)) & {
				references?: NumberColumn;
			};
	  }
	| {
			type: 'text';
			schema: ({
				unique: boolean;
				deprecated: boolean;
				name?: string | undefined;
				label?: string | undefined;
				collection?: string | undefined;
				default?: string | import('../runtime/types.js').SerializedSQL | undefined;
				multiline?: boolean | undefined;
				enum?: [string, ...string[]] | undefined;
			} & (
				| {
						primaryKey: false;
						optional: boolean;
				  }
				| {
						primaryKey: true;
						optional?: false | undefined;
				  }
			)) & {
				references?: TextColumn;
			};
	  }
	| undefined;
type WithDefaultDefined<T extends DBColumn> = T & {
	schema: Required<Pick<T['schema'], 'default'>>;
};
type DBColumnWithDefault =
	| WithDefaultDefined<TextColumn>
	| WithDefaultDefined<DateColumn>
	| WithDefaultDefined<NumberColumn>
	| WithDefaultDefined<BooleanColumn>
	| WithDefaultDefined<JsonColumn>;
export declare function hasDefault(column: DBColumn): column is DBColumnWithDefault;
export {};
