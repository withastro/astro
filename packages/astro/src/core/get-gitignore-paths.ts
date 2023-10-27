import fs from 'node:fs';
import { EOL } from 'node:os';
import { joinPaths } from './path.js';

/**
 * clear empty lines and comments
 */
const isValidText = (text: string) => {
	const pattern = text.trim();
	return pattern.length && !pattern.startsWith('#');
};

/**
 * check if text is a ignore file
 */
const isIgnoreFile = (text: string) => {
	return /.*\..{1}.*$/.test(text) || text.startsWith('!') || text.endsWith('*');
};

/**
 * check if text is a reg pattern
 */
const isIgnoreReg = (text: string) => {
	return text.includes('**');
};

/**
 * check if text is a dir
 */
const isIgnoreDir = (text: string) => {
	return text.endsWith('/');
};

const getDirText = (line: string) => {
	let start = '/';
	let end = '/';
	if (line.startsWith('/')) {
		start = '';
	}
	if (line.endsWith('/')) {
		end = '';
	}
	return `**${start}${line}${end}**`;
};

export function gitText2Paths(text: string): string[] {
	const lines = Array.from(new Set<string>(text.split(EOL).filter(isValidText)));
	return lines.map((line) => {
		if (isIgnoreDir(line)) {
			return getDirText(line);
		} else if (isIgnoreFile(line) || isIgnoreReg(line)) {
			return line;
		} else {
			return getDirText(line);
		}
	});
}

/**
 * read .gitignore file and return ignore paths
 * @param root astro root path
 */
export async function getGitignorePaths(root: string) {
	const gitIgnoreFile = joinPaths(root, '.gitignore');
	const text = await fs.promises
		.readFile(gitIgnoreFile, 'utf-8')
		.then((data) => data.toString())
		.catch(() => '');
	if (!text.length) {
		return [];
	}
	return gitText2Paths(text);
}
