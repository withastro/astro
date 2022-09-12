import fs from 'node:fs/promises';

export async function loadLocalImage(src: string | URL) {
	try {
		return await fs.readFile(src);
	} catch {
		return undefined;
	}
}

export async function loadRemoteImage(src: string) {
	try {
		const res = await fetch(src);

		if (!res.ok) {
			return undefined;
		}

		return Buffer.from(await res.arrayBuffer());
	} catch {
		return undefined;
	}
}
