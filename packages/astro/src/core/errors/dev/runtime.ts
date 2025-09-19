import { escape } from 'html-escaper';
import { bold, underline } from 'kleur/colors';
import { AstroErrorData, type ErrorWithMetadata } from '../index.js';

/**
 * The docs has kebab-case urls for errors, so we need to convert the error name
 * @param errorName
 */
function getKebabErrorName(errorName: string): string {
	return errorName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
export function getDocsForError(err: ErrorWithMetadata): string | undefined {
	if (err.name !== 'UnknownError' && err.name in AstroErrorData) {
		return `https://docs.astro.build/en/reference/errors/${getKebabErrorName(err.name)}/`;
	}
	return undefined;
}

const linkRegex = /\[([^[]+)\]\((.*)\)/g;
const boldRegex = /\*\*(.+)\*\*/g;
const urlRegex = / ((?:https?|ftp):\/\/[-\w+&@#\\/%?=~|!:,.;]*[-\w+&@#\\/%=~|])/gi;
const codeRegex = /`([^`]+)`/g;

/**
 * Render a subset of Markdown to HTML or a CLI output
 */
export function renderErrorMarkdown(markdown: string, target: 'html' | 'cli') {
	if (target === 'html') {
		return escape(markdown)
			.replace(linkRegex, `<a href="$2" target="_blank">$1</a>`)
			.replace(boldRegex, '<b>$1</b>')
			.replace(urlRegex, ' <a href="$1" target="_blank">$1</a>')
			.replace(codeRegex, '<code>$1</code>');
	} else {
		return markdown
			.replace(linkRegex, (_, m1, m2) => `${bold(m1)} ${underline(m2)}`)
			.replace(urlRegex, (fullMatch) => ` ${underline(fullMatch.trim())}`)
			.replace(boldRegex, (_, m1) => `${bold(m1)}`);
	}
}
