import type { Logger } from '../../core/logger/core.js';
import type { AstroVersionProvider, HelpDisplay, TextStyler } from '../definitions.js';
import type { HelpPayload } from '../domain/help-payload.js';
import type { Flags } from '../flags.js';
import { formatVersion } from '../utils/format-version.js';

export class LoggerHelpDisplay implements HelpDisplay {
	readonly #logger: Logger;
	readonly #textStyler: TextStyler;
	readonly #astroVersionProvider: AstroVersionProvider;
	// TODO: find something better
	readonly #flags: Flags;

	constructor({
		logger,
		textStyler,
		astroVersionProvider,
		flags,
	}: {
		logger: Logger;
		textStyler: TextStyler;
		astroVersionProvider: AstroVersionProvider;
		flags: Flags;
	}) {
		this.#logger = logger;
		this.#textStyler = textStyler;
		this.#astroVersionProvider = astroVersionProvider;
		this.#flags = flags;
	}

	shouldFire(): boolean {
		return !!(this.#flags.help || this.#flags.h);
	}

	show({ commandName, description, headline, tables, usage }: HelpPayload): void {
		const linebreak = () => '';
		const title = (label: string) =>
			`  ${this.#textStyler.bgWhite(this.#textStyler.black(` ${label} `))}`;
		const table = (rows: [string, string][], { padding }: { padding: number }) => {
			const split = process.stdout.columns < 60;
			let raw = '';

			for (const row of rows) {
				if (split) {
					raw += `    ${row[0]}\n    `;
				} else {
					raw += `${`${row[0]}`.padStart(padding)}`;
				}
				raw += '  ' + this.#textStyler.dim(row[1]) + '\n';
			}

			return raw.slice(0, -1); // remove latest \n
		};

		let message = [];

		if (headline) {
			message.push(
				linebreak(),
				`${formatVersion({ name: commandName, textStyler: this.#textStyler, astroVersionProvider: this.#astroVersionProvider })} ${headline}`,
			);
		}

		if (usage) {
			message.push(
				linebreak(),
				`  ${this.#textStyler.green(commandName)} ${this.#textStyler.bold(usage)}`,
			);
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

		this.#logger.info('SKIP_FORMAT', message.join('\n') + '\n');
	}
}
