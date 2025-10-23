import colors from 'picocolors';

export const MISSING_EXECUTE_PATH_ERROR = `${colors.red(
	'▶ No file path provided.',
)} Provide a path by running ${colors.cyan('astro db execute <path>')}\n`;

export const RENAME_TABLE_ERROR = (oldTable: string, newTable: string) => {
	return (
		colors.red('\u25B6 Potential table rename detected: ' + oldTable + ' -> ' + newTable) +
		`
  You cannot add and remove tables in the same schema update batch.

  1. Use "deprecated: true" to deprecate a table before renaming.
  2. Use "--force-reset" to ignore this warning and reset the database (deleting all of your data).

	Visit https://docs.astro.build/en/guides/astro-db/#renaming-tables to learn more.`
	);
};

export const RENAME_COLUMN_ERROR = (oldSelector: string, newSelector: string) => {
	return (
		colors.red('▶ Potential column rename detected: ' + oldSelector + ', ' + newSelector) +
		`\n  You cannot add and remove columns in the same table.` +
		`\n  To resolve, add a 'deprecated: true' flag to '${oldSelector}' instead.`
	);
};

export const FILE_NOT_FOUND_ERROR = (path: string) =>
	`${colors.red('▶ File not found:')} ${colors.bold(path)}\n`;

export const SHELL_QUERY_MISSING_ERROR = `${colors.red(
	'▶ Please provide a query to execute using the --query flag.',
)}\n`;

export const EXEC_ERROR = (error: string) => {
	return `${colors.red(`Error while executing file:`)}\n\n${error}`;
};

export const EXEC_DEFAULT_EXPORT_ERROR = (fileName: string) => {
	return EXEC_ERROR(`Missing default function export in ${colors.bold(fileName)}`);
};

export const INTEGRATION_TABLE_CONFLICT_ERROR = (
	integrationName: string,
	tableName: string,
	isUserConflict: boolean,
) => {
	return colors.red('▶ Conflicting table name in integration ' + colors.bold(integrationName)) +
		isUserConflict
		? `\n  A user-defined table named ${colors.bold(tableName)} already exists`
		: `\n  Another integration already added a table named ${colors.bold(tableName)}`;
};
