import {promisify} from "node:util";
import fs from "node:fs";
import path from "node:path";
import {configPaths} from "./config.js";

export async function scanForConfigs(rootDir: string): Promise<string[]> {
	rootDir = await (promisify(fs.realpath))(rootDir);

	const foundFiles: string[] = [];
	const stack: string[] = [rootDir];
	
	while (stack.length > 0) {
		const dir = stack.pop();
		if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
			continue;
		}
	
		for (const entry of fs.readdirSync(dir)) {
			const fullPath = path.join(dir, entry);
	
			try {
				const stats = await (promisify(fs.lstat))(fullPath);
	
				if (stats.isDirectory()) {
					stack.push(fullPath);
				} else if (configPaths.includes(entry)) {
					if (path.resolve(path.dirname(fullPath)) != rootDir) {
						foundFiles.push(fullPath);
					}
				}
			} catch (error: any) {
				console.warn(`Skipping ${fullPath}: ${error?.message ?? error}`);
			}
		}
	}
	
	return foundFiles;
}
