import type { SQL } from "drizzle-orm";
import type { DBColumn, DBColumns, DBSnapshot, DBTable, ResolvedDBTable, ResolvedIndexes } from "../types.js";

export interface DatabaseBackend<Op = unknown> {
	getDropTableIfExistsOps(tableName: string): Op[];
	getCreateTableOps(tableName: string, table: DBTable): Op[];
	getCreateIndexOps(tableName: string, table: Pick<DBTable, 'indexes'>): Op[];

	getChangeIndexOps(options: {
		tableName: string;
		oldIndexes?: ResolvedIndexes;
		newIndexes?: ResolvedIndexes;
	}): Op[];

	getRecreateTableOps(options: {
		tableName: string;
		newTable: ResolvedDBTable;
		added: Record<string, DBColumn>;
		hasDataLoss: boolean;
		migrateHiddenPrimaryKey: boolean;
	}): Op[];

	/**
	 * Get ALTER TABLE queries to update the table schema. Assumes all added and dropped columns pass
	 * `canUseAlterTableAddColumn` and `canAlterTableDropColumn` checks!
	 */
	getAlterTableOps(
		unescTableName: string,
		added: DBColumns,
		dropped: DBColumns,
	): Op[];

	canAlterTableAddColumn(column: DBColumn): boolean;
	canAlterTableDropColumn(column: DBColumn): boolean;

	getCreateSnapshotRegistryOps(): Op[];
	getStoreSnapshotOps(version: string, snapshot: DBSnapshot): Op[];

	executeOps(target: 'local' | 'remote', ops: Op[]): Promise<void>;
	executeSql(target: 'local' | 'remote', statement: string | SQL): Promise<any>;

	getDbExportModule(target: 'local' | 'remote'): string;
	getTypeDeclarations(): string;
}

export type GenericTransaction = {
	run: (sql: string | SQL) => Promise<void>;
};
