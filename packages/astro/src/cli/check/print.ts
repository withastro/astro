import { Diagnostic, DiagnosticSeverity, offsetAt } from '@astrojs/language-server';
import {
	bgRed,
	bgWhite,
	bgYellow,
	black,
	bold,
	cyan,
	gray,
	red,
	white,
	yellow,
} from 'kleur/colors';
import stringWidth from 'string-width';
import { fileURLToPath } from 'url';

export function printDiagnostic(filePath: string, text: string, diag: Diagnostic): string {
	let result = [];

	// Lines and characters are 0-indexed, so we need to add 1 to the offset to get the actual line and character
	const realStartLine = diag.range.start.line + 1;
	const realStartCharacter = diag.range.start.character + 1;
	const normalizedFilePath = fileURLToPath(new URL(filePath, 'file://'));

	// IDE friendly path that user can CTRL+Click to open the file at a specific line / character
	const IDEFilePath = `${bold(cyan(normalizedFilePath))}:${bold(yellow(realStartLine))}:${bold(
		yellow(realStartCharacter)
	)}`;
	result.push(
		`${IDEFilePath} ${bold(getColorForSeverity(diag, getStringForSeverity(diag)))}: ${diag.message}`
	);

	// Optionally add the line before the error to add context if not empty
	const previousLine = getLine(diag.range.start.line - 1, text);
	if (previousLine) {
		result.push(`${getPrintableLineNumber(realStartLine - 1)}  ${gray(previousLine)}`);
	}

	// Add the line with the error
	const str = getLine(diag.range.start.line, text);
	const lineNumStr = realStartLine.toString().padStart(2, '0');
	const lineNumLen = lineNumStr.length;
	result.push(`${getBackgroundForSeverity(diag, lineNumStr)}  ${str}`);

	// Adds tildes under the specific range where the diagnostic is
	const tildes = generateString('~', diag.range.end.character - diag.range.start.character);

	// NOTE: This is not perfect, if the line include any characters that is made of multiple characters, for example
	// regionals flags, but the terminal can't display it, then the number of spaces will be wrong. Not sure how to fix.
	const beforeChars = stringWidth(str.substring(0, diag.range.start.character));
	const spaces = generateString(' ', beforeChars + lineNumLen - 1);
	result.push(`   ${spaces}${bold(getColorForSeverity(diag, tildes))}`);

	const nextLine = getLine(diag.range.start.line + 1, text);
	if (nextLine) {
		result.push(`${getPrintableLineNumber(realStartLine + 1)}  ${gray(nextLine)}`);
	}

	// Force a new line at the end
	result.push('');

	return result.join('\n');
}

function generateString(str: string, len: number): string {
	return Array.from({ length: len }, () => str).join('');
}

function getStringForSeverity(diag: Diagnostic): string {
	switch (diag.severity) {
		case DiagnosticSeverity.Error:
			return 'Error';
		case DiagnosticSeverity.Warning:
			return 'Warning';
		case DiagnosticSeverity.Hint:
			return 'Hint';
		default:
			return 'Unknown';
	}
}

function getColorForSeverity(diag: Diagnostic, text: string): string {
	switch (diag.severity) {
		case DiagnosticSeverity.Error:
			return red(text);
		case DiagnosticSeverity.Warning:
			return yellow(text);
		case DiagnosticSeverity.Hint:
			return gray(text);
		default:
			return text;
	}
}

function getBackgroundForSeverity(diag: Diagnostic, text: string): string {
	switch (diag.severity) {
		case DiagnosticSeverity.Error:
			return bgRed(white(text));
		case DiagnosticSeverity.Warning:
			return bgYellow(white(text));
		case DiagnosticSeverity.Hint:
			return bgWhite(black(text));
		default:
			return text;
	}
}

function getPrintableLineNumber(line: number): string {
	return bgWhite(black(line.toString().padStart(2, '0')));
}

function getLine(line: number, text: string): string {
	return text
		.substring(
			offsetAt({ line, character: 0 }, text),
			offsetAt({ line, character: Number.MAX_SAFE_INTEGER }, text)
		)
		.replace(/\t/g, ' ')
		.trimEnd();
}
