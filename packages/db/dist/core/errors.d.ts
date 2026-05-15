export declare const MISSING_EXECUTE_PATH_ERROR: string;
export declare const RENAME_TABLE_ERROR: (oldTable: string, newTable: string) => string;
export declare const RENAME_COLUMN_ERROR: (oldSelector: string, newSelector: string) => string;
export declare const FILE_NOT_FOUND_ERROR: (path: string) => string;
export declare const SHELL_QUERY_MISSING_ERROR: string;
export declare const EXEC_ERROR: (error: string) => string;
export declare const EXEC_DEFAULT_EXPORT_ERROR: (fileName: string) => string;
export declare const INTEGRATION_TABLE_CONFLICT_ERROR: (
	integrationName: string,
	tableName: string,
	isUserConflict: boolean,
) => string;
