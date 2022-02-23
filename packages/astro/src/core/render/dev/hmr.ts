import fs from 'fs';
import { fileURLToPath } from 'url';

let hmrScript: string;
export async function getHmrScript() {
	if (hmrScript) return hmrScript;
	const filePath = fileURLToPath(new URL('../../../runtime/client/hmr.js', import.meta.url));
	const content = await fs.promises.readFile(filePath);
	hmrScript = content.toString();
	return hmrScript;
}
