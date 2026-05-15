import { formatVersion } from '../utils/format-version.js';
class LoggerHelpDisplay {
	#logger;
	#textStyler;
	#astroVersionProvider;
	// TODO: find something better
	#flags;
	constructor({ logger, textStyler, astroVersionProvider, flags }) {
		this.#logger = logger;
		this.#textStyler = textStyler;
		this.#astroVersionProvider = astroVersionProvider;
		this.#flags = flags;
	}
	shouldFire() {
		return !!(this.#flags.help || this.#flags.h);
	}
	show({ commandName, description, headline, tables, usage }) {
		const linebreak = () => '';
		const title = (label) => `  ${this.#textStyler.bgWhite(this.#textStyler.black(` ${label} `))}`;
		const table = (rows, { padding }) => {
			const split = process.stdout.columns < 60;
			let raw = '';
			for (const row of rows) {
				if (split) {
					raw += `    ${row[0]}
    `;
				} else {
					raw += `${`${row[0]}`.padStart(padding)}`;
				}
				raw += '  ' + this.#textStyler.dim(row[1]) + '\n';
			}
			return raw.slice(0, -1);
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
			let calculateTablePadding2 = function (rows) {
				return rows.reduce((val, [first]) => Math.max(val, first.length), 0) + 2;
			};
			var calculateTablePadding = calculateTablePadding2;
			const tableEntries = Object.entries(tables);
			const padding = Math.max(...tableEntries.map(([, rows]) => calculateTablePadding2(rows)));
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
export { LoggerHelpDisplay };
