import { cyan, bold, red, green, yellow } from 'kleur/colors';

export const MISSING_SESSION_ID_ERROR = `${red('▶ Login required!')}

  To authenticate with Astro Studio, run
  ${cyan('astro db login')}\n`;

export const MISSING_PROJECT_ID_ERROR = `${red('▶ Directory not linked.')}

  To link this directory to an Astro Studio project, run
  ${cyan('astro db link')}\n`;

export const UNSAFE_DISABLE_STUDIO_WARNING = `${yellow(
	'unsafeDisableStudio'
)} option is enabled and you are deploying your database without Studio.
  Redeploying your app may result in wiping away your database.
	I hope you know what you are doing.\n`;

export const MIGRATIONS_NOT_INITIALIZED = `${yellow(
	'▶ No migrations found!'
)}\n\n  To scaffold your migrations folder, run\n  ${cyan('astro db sync')}\n`;

export const MISSING_EXECUTE_PATH_ERROR = `${red(
	'▶ No file path provided.'
)} Provide a path by running ${cyan('astro db execute <path>')}\n`;

export const FILE_NOT_FOUND_ERROR = (path: string) =>
	`${red('▶ File not found:')} ${bold(path)}\n`;

export const SEED_ERROR = (tableName: string, error: string) => {
	return `${red(`Error seeding table ${bold(tableName)}:`)}\n\n${error}`;
};

export const SEED_EMPTY_ARRAY_ERROR = (tableName: string) => {
	// Drizzle error says "values() must be called with at least one value."
	// This is specific to db.insert(). Prettify for seed().
	return SEED_ERROR(tableName, `Empty array was passed. seed() must receive at least one value.`);
};
