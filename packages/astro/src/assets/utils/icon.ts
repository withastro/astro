import fs, { readFileSync } from 'node:fs';
import type { AstroConfig, AstroSettings } from '../../@types/astro';
import { prependForwardSlash } from '../../core/path.js';

interface IconCollection {
    prefix: string;
    info: Record<string, string>;
    lastModified: number;
    icons: Record<string, IconData>;
}
interface IconData {
	body: string;
    width?: number;
    height?: number;
}

const ICONIFY_REPO = new URL(`https://raw.githubusercontent.com/iconify/icon-sets/master/json/`);
function getIconifyUrl(collection: string) {
    return new URL(`./${collection}.json`, ICONIFY_REPO);
}

export async function getIconData(
	settings: AstroSettings,
	collection: string,
	name: string
): Promise<IconData | undefined> {
	const iconsCacheDir = new URL('assets/icons/', settings.config.cacheDir);

	// Ensure that the cache directory exists
	try {
		await fs.promises.mkdir(iconsCacheDir, { recursive: true });
	} catch (err) {
		// logger.warn(
		// 	'astro:assets',
		// 	`An error was encountered while creating the cache directory. Proceeding without caching. Error: ${err}`
		// );
	}

	const cachedFileURL = new URL(`./${collection}.json`, iconsCacheDir);

    let collectionData: IconCollection | undefined;
    if (fs.existsSync(cachedFileURL)) {
        try {
            collectionData = JSON.parse(fs.readFileSync(cachedFileURL, { encoding: 'utf8' })) as IconCollection;
        } catch {}
    }
    if (!collectionData) {
        try {
            const res = await fetch(getIconifyUrl(collection));
            collectionData = await res.json();
            await fs.promises.writeFile(cachedFileURL, JSON.stringify(collectionData), { encoding: 'utf8' })
        } catch (e) {
            throw new Error(`Unable to locate icon "${collection}/${name}"`)
        }
    }
    const { icons } = collectionData!;
    if (icons[name] === undefined) {
        throw new Error(`Unable to locate icon "${collection}/${name}"`)
    }

    return icons[name];
}
