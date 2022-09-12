import fs from 'node:fs';

export function isEmpty(dirPath: string) {
	return !fs.existsSync(dirPath) || fs.readdirSync(dirPath).length === 0;
}
