import type { Logger } from '../../core/logger/core.js';
import type { AstroVersionProvider, HelpDisplay, TextStyler } from '../definitions.js';
import type { Flags } from '../flags.js';
import { formatVersion } from '../utils/format-version.js';

interface Options {
	logger: Logger;
	textStyler: TextStyler;
	astroVersionProvider: AstroVersionProvider;
	// TODO: find something better
	flags: Flags;
}

export function createLoggerHelpDisplay({
	logger,
	flags,
	textStyler,
	astroVersionProvider,
}: Options): HelpDisplay {
	return {
		shouldFire() {
			return !!(flags.help || flags.h);
		},
		show({ commandName, description, headline, tables, usage }) {
			const linebreak = () => '';
			const title = (label: string) => `  ${textStyler.bgWhite(textStyler.black(` ${label} `))}`;
			const table = (rows: [string, string][], { padding }: { padding: number }) => {
				const split = process.stdout.columns < 60;
				let raw = '';

				for (const row of rows) {
					if (split) {
						raw += `    ${row[0]}\n    `;
					} else {
						raw += `${`${row[0]}`.padStart(padding)}`;
					}
					raw += '  ' + textStyler.dim(row[1]) + '\n';
				}

				return raw.slice(0, -1); // remove latest \n
			};

			let message = [];

			if (headline) {
				message.push(
					linebreak(),
					`${formatVersion({ name: commandName, textStyler, astroVersionProvider })} ${headline}`,
				);
			}

			if (usage) {
				message.push(linebreak(), `  ${textStyler.green(commandName)} ${textStyler.bold(usage)}`);
			}

			if (tables) {
				function calculateTablePadding(rows: [string, string][]) {
					return rows.reduce((val, [first]) => Math.max(val, first.length), 0) + 2;
				}

				const tableEntries = Object.entries(tables);
				const padding = Math.max(...tableEntries.map(([, rows]) => calculateTablePadding(rows)));
				for (const [tableTitle, tableRows] of tableEntries) {
					message.push(linebreak(), title(tableTitle), table(tableRows, { padding }));
				}
			}

			if (description) {
				message.push(linebreak(), `${description}`);
			}

			logger.info('SKIP_FORMAT', message.join('\n') + '\n');
		},
	};
}
