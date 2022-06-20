import fs from 'fs';

export function ensureDir(dir: string) {
	fs.mkdirSync(dir, { recursive: true });
}
