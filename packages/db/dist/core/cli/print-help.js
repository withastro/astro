import colors from 'piccolore';
function printHelp({ commandName, headline, usage, tables, description }) {
	const linebreak = () => '';
	const title = (label) => `  ${colors.bgWhite(colors.black(` ${label} `))}`;
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
			raw += '  ' + colors.dim(row[1]) + '\n';
		}
		return raw.slice(0, -1);
	};
	let message = [];
	if (headline) {
		message.push(
			linebreak(),
			`  ${colors.bgGreen(colors.black(` ${commandName} `))} ${colors.green(
				`v${'0.21.1'}`,
			)} ${headline}`,
		);
	}
	if (usage) {
		message.push(linebreak(), `  ${colors.green(commandName)} ${colors.bold(usage)}`);
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
	console.log(message.join('\n') + '\n');
}
export { printHelp };
