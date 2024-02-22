import { cyan, bold, red, green, yellow } from 'kleur/colors';

export const MISSING_SESSION_ID_ERROR = `${red('▶ Login required!')}

  To authenticate with Astro Studio, run
  ${cyan('astro db login')}\n`;

export const MISSING_PROJECT_ID_ERROR = `${red('▶ Directory not linked.')}

  To link this directory to an Astro Studio project, run
  ${cyan('astro db link')}\n`;

export const STUDIO_CONFIG_MISSING_WRITABLE_TABLE_ERROR = (tableName: string) => `${red(
	`▶ Writable table ${bold(tableName)} requires Astro Studio or the ${yellow(
		'unsafeWritable'
	)} option.`
)}

  Visit ${cyan('https://astro.build/studio')} to create your account
  and set ${green('studio: true')} in your astro.config.mjs file to enable Studio.\n`;

export const UNSAFE_WRITABLE_WARNING = `${yellow(
	'unsafeWritable'
)} option is enabled and you are using writable tables.
  Redeploying your app may result in wiping away your database.
	I hope you know what you are doing.\n`;

export const STUDIO_CONFIG_MISSING_CLI_ERROR = `${red('▶ This command requires Astro Studio.')}

  Visit ${cyan('https://astro.build/studio')} to create your account
  and set ${green('studio: true')} in your astro.config.mjs file to enable Studio.\n`;

export const MIGRATIONS_NOT_INITIALIZED = `${yellow(
	'▶ No migrations found!'
)}\n\n  To scaffold your migrations folder, run\n  ${cyan('astro db sync')}\n`;

export const SEED_WRITABLE_IN_PROD_ERROR = (tableName: string) => {
	return `${red(
		`Writable tables should not be seeded in production with data().`
	)} You can seed ${bold(
		tableName
	)} in development mode only using the "mode" flag. See the docs for more: https://www.notion.so/astroinc/astrojs-db-README-dcf6fa10de9a4f528be56cee96e8c054?pvs=4#278aed3fc37e4cec80240d1552ff6ac5`;
};

export const SEED_ERROR = (tableName: string, error: string) => {
	return `${red(`Error seeding table ${bold(tableName)}:`)}\n\n${error}`;
};

export const SEED_EMPTY_ARRAY_ERROR = (tableName: string) => {
	// Drizzle error says "values() must be called with at least one value."
	// This is specific to db.insert(). Prettify for seed().
	return SEED_ERROR(tableName, `Empty array was passed. seed() must receive at least one value.`);
};
