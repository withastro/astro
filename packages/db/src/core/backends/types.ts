import type { DBColumn, DBColumns, DBTable, ResolvedDBTable, ResolvedIndexes } from "../types.js";

export interface DatabaseBackend<Op> {
	getDropIfExistsOps(tableName: string): Op[];
	getCreateOps(tableName: string, table: DBTable): Op[];
	getCreateIndexOps(tableName: string, table: Pick<DBTable, 'indexes'>): Op[];

	getChangeIndexOps(options: {
		tableName: string;
		oldIndexes?: ResolvedIndexes;
		newIndexes?: ResolvedIndexes;
	}): Op[];
	getRecreateTableQueries(options: {
		tableName: string;
		newTable: ResolvedDBTable;
		added: Record<string, DBColumn>;
		hasDataLoss: boolean;
		migrateHiddenPrimaryKey: boolean;
	}): Op[];
	getAlterTableQueries(
		unescTableName: string,
		added: DBColumns,
		dropped: DBColumns,
	): Op[];

	executeOps(ops: Op[]): Promise<void>;

	getClientImportStatement(): string;
	getTypesModule(): string;
}
