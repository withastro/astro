export function resolveClientDevPath(id: string) {
	if (id.startsWith('/@fs')) {
		// Vite does not resolve .jsx -> .tsx when coming from the client, so clip the extension.
		if (id.endsWith('.jsx')) {
			return id.slice(0, id.length - 4);
		}
	}
	return id;
}
