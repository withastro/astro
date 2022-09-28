import { execa } from 'execa';
import fs from 'node:fs';

// Some existing files and directories can be safely ignored when checking if a directory is a valid project directory.
// https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/create-react-app/createReactApp.js#L907-L934
const VALID_PROJECT_DIRECTORY_SAFE_LIST = [
	'.DS_Store',
	'.git',
	'.gitattributes',
	'.gitignore',
	'.gitlab-ci.yml',
	'.hg',
	'.hgcheck',
	'.hgignore',
	'.idea',
	'.npmignore',
	'.travis.yml',
	'.yarn',
	'.yarnrc.yml',
	'docs',
	'LICENSE',
	'mkdocs.yml',
	'Thumbs.db',
	/\.iml$/,
	/^npm-debug\.log/,
	/^yarn-debug\.log/,
	/^yarn-error\.log/,
];

export function isEmpty(dirPath: string) {
	if (!fs.existsSync(dirPath)) {
		return true;
	}

	const conflicts = fs.readdirSync(dirPath).filter((content) => {
		return !VALID_PROJECT_DIRECTORY_SAFE_LIST.some((safeContent) => {
			return typeof safeContent === 'string' ? content === safeContent : safeContent.test(content);
		});
	});

	return conflicts.length === 0;
}

export function toValidName(name: string) {
	return name
		.replace(/^\.\//, '')
		.replace(/[^a-zA-Z0-9-]/g, '-')
		.replace(/(^\-|\-$)+/, '');
}

export async function hasVSCodeExtension(): Promise<boolean> {
	try {
		const { stdout } = await execa('code', ['--list-extensions']);
		return !!stdout.split('\n').find(ln => ln === 'astro.build.astro-vscode');
	} catch (e) {}

	return false;
}
