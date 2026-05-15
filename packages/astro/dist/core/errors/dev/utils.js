import * as fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { escape } from 'html-escaper';
import colors from 'piccolore';
import { removeLeadingForwardSlashWindows } from '../../path.js';
import { normalizePath } from '../../viteUtils.js';
import { AggregateError } from '../errors.js';
import { codeFrame } from '../printer.js';
import { normalizeLF } from '../utils.js';
function collectErrorMetadata(e, rootFolder) {
	const err = AggregateError.is(e) || Array.isArray(e.errors) ? e.errors : [e];
	err.forEach((error) => {
		if (e.stack) {
			const stackInfo = collectInfoFromStacktrace(e);
			try {
				error.stack = stripVTControlCharacters(stackInfo.stack);
			} catch {}
			error.loc = stackInfo.loc;
			error.plugin = stackInfo.plugin;
			error.pluginCode = stackInfo.pluginCode;
		}
		const normalizedFile = normalizePath(error.loc?.file || '');
		const normalizedRootFolder = removeLeadingForwardSlashWindows(rootFolder?.pathname || '');
		if (
			error.loc?.file &&
			rootFolder &&
			(!normalizedFile?.startsWith(normalizedRootFolder) || !isAbsolute(normalizedFile))
		) {
			error.loc.file = join(fileURLToPath(rootFolder), error.loc.file);
		}
		if (error.loc && (!error.frame || !error.fullCode)) {
			try {
				const fileContents = fs.readFileSync(error.loc.file, 'utf8');
				if (!error.frame) {
					const frame = codeFrame(fileContents, error.loc);
					error.frame = stripVTControlCharacters(frame);
				}
				if (!error.fullCode) {
					error.fullCode = fileContents;
				}
			} catch {}
		}
		error.hint = generateHint(e);
		if (error.message) {
			try {
				error.message = stripVTControlCharacters(error.message);
			} catch {}
		}
	});
	if (!AggregateError.is(e) && Array.isArray(e.errors)) {
		e.errors.forEach((buildError, i) => {
			const { location, pluginName, text } = buildError;
			if (text) {
				try {
					err[i].message = text;
				} catch {}
			}
			if (location) {
				err[i].loc = { file: location.file, line: location.line, column: location.column };
				err[i].id = err[0].id || location?.file;
			}
			if (err[i].frame) {
				const errorLines = err[i].frame?.trim().split('\n');
				if (errorLines) {
					err[i].frame = !/^\d/.test(errorLines[0])
						? errorLines?.slice(1).join('\n')
						: err[i].frame;
				}
			}
			const possibleFilePath = location?.file ?? err[i].id;
			if (possibleFilePath && err[i].loc && (!err[i].frame || !err[i].fullCode)) {
				try {
					const fileContents = fs.readFileSync(possibleFilePath, 'utf8');
					if (!err[i].frame) {
						err[i].frame = codeFrame(fileContents, { ...err[i].loc, file: possibleFilePath });
					}
					err[i].fullCode = fileContents;
				} catch {
					err[i].fullCode = err[i].pluginCode;
				}
			}
			if (pluginName) {
				err[i].plugin = pluginName;
			}
			err[i].hint = generateHint(err[0]);
		});
	}
	return err[0];
}
function generateHint(err) {
	const commonBrowserAPIs = ['document', 'window'];
	if (/Unknown file extension "\.(?:jsx|vue|svelte|astro|css)" for /.test(err.message)) {
		return 'You likely need to add this package to `vite.resolve.noExternal` in your astro config file.';
	} else if (commonBrowserAPIs.some((api) => err.toString().includes(api))) {
		const hint = `Browser APIs are not available on the server.

${err.loc?.file?.endsWith('.astro') ? 'Move your code to a <script> tag outside of the frontmatter, so the code runs on the client.' : 'If the code is in a framework component, try to access these objects after rendering using lifecycle methods or use a `client:only` directive to make the component exclusively run on the client.'}

See https://docs.astro.build/en/guides/troubleshooting/#document-or-window-is-not-defined for more information.
		`;
		return hint;
	}
	return err.hint;
}
function collectInfoFromStacktrace(error) {
	let stackInfo = {
		stack: error.stack,
		plugin: error.plugin,
		pluginCode: error.pluginCode,
		loc: error.loc,
	};
	stackInfo.stack = normalizeLF(error.stack);
	const stackText = stripVTControlCharacters(error.stack);
	if (!stackInfo.loc || (!stackInfo.loc.column && !stackInfo.loc.line)) {
		const possibleFilePath =
			error.loc?.file ||
			error.pluginCode ||
			error.id || // TODO: this could be better, `src` might be something else
			stackText.split('\n').find((ln) => ln.includes('src') || ln.includes('node_modules'));
		const source = possibleFilePath?.replace?.(/^[^(]+\(([^)]+).*$/, '$1').replace(/^\s+at\s+/, '');
		let file = source?.replace(/:\d+/g, '');
		const location = /:(\d+):(\d+)/.exec(source) ?? [];
		const line = location[1];
		const column = location[2];
		if (file && line && column) {
			try {
				file = fileURLToPath(file);
			} catch {}
			stackInfo.loc = {
				file,
				line: Number.parseInt(line),
				column: Number.parseInt(column),
			};
		}
	}
	if (!stackInfo.plugin) {
		stackInfo.plugin =
			/withastro\/astro\/packages\/integrations\/([\w-]+)/i.exec(stackText)?.at(1) ||
			/(@astrojs\/[\w-]+)\/(server|client|index)/i.exec(stackText)?.at(1) ||
			void 0;
	}
	stackInfo.stack = cleanErrorStack(error.stack);
	return stackInfo;
}
function cleanErrorStack(stack) {
	return stack
		.split(/\n/)
		.map((l) => l.replace(/\/@fs\//g, '/'))
		.join('\n');
}
const linkRegex = /\[([^[]+)\]\(([^)]*)\)/g;
const boldRegex = /\*\*(.+)\*\*/g;
const urlRegex = / ((?:https?|ftp):\/\/[-\w+&@#\\/%?=~|!:,.;]*[-\w+&@#\\/%=~|])/gi;
const codeRegex = /`([^`]+)`/g;
function isAllowedUrl(url) {
	const trimmedUrl = url.trim();
	if (!trimmedUrl) return false;
	try {
		const parsedUrl = new URL(trimmedUrl);
		return ['http:', 'https:'].includes(parsedUrl.protocol);
	} catch {
		return false;
	}
}
function renderErrorMarkdown(markdown, target) {
	if (target === 'html') {
		return escape(markdown)
			.replace(linkRegex, (_match, text, url) => {
				if (!isAllowedUrl(url)) {
					return text;
				}
				return `<a href="${url}" target="_blank">${text}</a>`;
			})
			.replace(boldRegex, '<b>$1</b>')
			.replace(urlRegex, ' <a href="$1" target="_blank">$1</a>')
			.replace(codeRegex, '<code>$1</code>');
	} else {
		return markdown
			.replace(linkRegex, (_, m1, m2) => {
				if (!isAllowedUrl(m2)) {
					return `${colors.bold(m1)} ${m2}`;
				}
				return `${colors.bold(m1)} ${colors.underline(m2)}`;
			})
			.replace(urlRegex, (fullMatch) => ` ${colors.underline(fullMatch.trim())}`)
			.replace(boldRegex, (_, m1) => `${colors.bold(m1)}`);
	}
}
export { collectErrorMetadata, renderErrorMarkdown };
