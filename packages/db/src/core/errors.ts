import { bold, cyan, red } from 'kleur/colors';

export const MISSING_SESSION_ID_ERROR = `${red('▶ Login required!')}

  To authenticate with Astro Studio, run
  ${cyan('astro db login')}\n`;

export const MISSING_PROJECT_ID_ERROR = `${red('▶ Directory not linked.')}

  To link this directory to an Astro Studio project, run
  ${cyan('astro db link')}\n`;

export const MISSING_EXECUTE_PATH_ERROR = `${red(
	'▶ No file path provided.'
)} Provide a path by running ${cyan('astro db execute <path>')}\n`;

export const RENAME_TABLE_ERROR = (oldTable: string, newTable: string) => {
	return (
		red('▶ Potential table rename detected: ' + oldTable + ', ' + newTable) +
		`\n  You cannot add and remove tables in the same schema update batch.` +
		`\n  To resolve, add a 'deprecated: true' flag to '${oldTable}' instead.`
	);
};

export const RENAME_COLUMN_ERROR = (oldSelector: string, newSelector: string) => {
	return (
		red('▶ Potential column rename detected: ' + oldSelector + ', ' + newSelector) +
		`\n  You cannot add and remove columns in the same table.` +
		`\n  To resolve, add a 'deprecated: true' flag to '${oldSelector}' instead.`
	);
};

export const FILE_NOT_FOUND_ERROR = (path: string) =>
	`${red('▶ File not found:')} ${bold(path)}\n`;

export const SHELL_QUERY_MISSING_ERROR = `${red(
	'▶ Please provide a query to execute using the --query flag.'
)}\n`;

export const SEED_ERROR = (error: string) => {
	return `${red(`Error while seeding database:`)}\n\n${error}`;
};

export const SEED_DEFAULT_EXPORT_ERROR = (fileName: string) => {
	return (
		red('Error while seeding database:') +
		`\n\nMissing default function export in ${bold(fileName)}`
	);
};

export const REFERENCE_DNE_ERROR = (columnName: string) => {
	return `Column ${bold(
		columnName
	)} references a table that does not exist. Did you apply the referenced table to the \`tables\` object in your db config?`;
};

export const FOREIGN_KEY_DNE_ERROR = (tableName: string) => {
	return `Table ${bold(
		tableName
	)} references a table that does not exist. Did you apply the referenced table to the \`tables\` object in your db config?`;
};

export const FOREIGN_KEY_REFERENCES_LENGTH_ERROR = (tableName: string) => {
	return `Foreign key on ${bold(
		tableName
	)} is misconfigured. \`columns\` and \`references\` must be the same length.`;
};

export const FOREIGN_KEY_REFERENCES_EMPTY_ERROR = (tableName: string) => {
	return `Foreign key on ${bold(
		tableName
	)} is misconfigured. \`references\` array cannot be empty.`;
};
