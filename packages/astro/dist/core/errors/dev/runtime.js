import { escape } from 'html-escaper';
import colors from 'piccolore';
import { AstroErrorData } from '../index.js';
function getKebabErrorName(errorName) {
	return errorName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
function getDocsForError(err) {
	if (err.name !== 'UnknownError' && err.name in AstroErrorData) {
		return `https://docs.astro.build/en/reference/errors/${getKebabErrorName(err.name)}/`;
	}
	return void 0;
}
const linkRegex = /\[([^[]+)\]\((.*)\)/g;
const boldRegex = /\*\*(.+)\*\*/g;
const urlRegex = / ((?:https?|ftp):\/\/[-\w+&@#\\/%?=~|!:,.;]*[-\w+&@#\\/%=~|])/gi;
const codeRegex = /`([^`]+)`/g;
function renderErrorMarkdown(markdown, target) {
	if (target === 'html') {
		return escape(markdown)
			.replace(linkRegex, `<a href="$2" target="_blank">$1</a>`)
			.replace(boldRegex, '<b>$1</b>')
			.replace(urlRegex, ' <a href="$1" target="_blank">$1</a>')
			.replace(codeRegex, '<code>$1</code>');
	} else {
		return markdown
			.replace(linkRegex, (_, m1, m2) => `${colors.bold(m1)} ${colors.underline(m2)}`)
			.replace(urlRegex, (fullMatch) => ` ${colors.underline(fullMatch.trim())}`)
			.replace(boldRegex, (_, m1) => `${colors.bold(m1)}`);
	}
}
export { getDocsForError, renderErrorMarkdown };
