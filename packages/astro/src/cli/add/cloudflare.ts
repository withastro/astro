import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

interface CloudflareInfo {
	getLocalWorkerdCompatibilityDate(): { date: string };
}

export async function getCloudflareCompatibilityDate(root: URL): Promise<string> {
	const require = createRequire(root);
	const infoPath = require.resolve('@astrojs/cloudflare/info');
	const infoUrl = pathToFileURL(infoPath).toString();
	const infoModule = (await import(infoUrl)) as CloudflareInfo;
	return infoModule.getLocalWorkerdCompatibilityDate().date;
}
