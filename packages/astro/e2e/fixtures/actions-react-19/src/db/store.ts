// Tiny file-backed store for the demo actions. State is read from and written to a
// JSON file on disk, so it is shared across every module instance the dev server
// evaluates (the page render and the action handler run in separate module graphs),
// the same way the previous SQLite-backed store was. The e2e tests reset it between
// runs by deleting `./temp/` (see the `afterEach` in actions-react-19.test.ts).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

interface Data {
	likes: Record<string, number>;
}

const file = new URL('./temp/store.json', import.meta.url);

function read(): Data {
	if (!existsSync(file)) {
		return { likes: { 'first-post': 10 } };
	}
	return JSON.parse(readFileSync(file, 'utf-8'));
}

function write(data: Data): void {
	mkdirSync(new URL('./temp/', import.meta.url), { recursive: true });
	writeFileSync(file, JSON.stringify(data));
}

export function getLikes(postId: string): number {
	return read().likes[postId] ?? 0;
}

export function incrementLikes(postId: string): number {
	const data = read();
	data.likes[postId] = (data.likes[postId] ?? 0) + 1;
	write(data);
	return data.likes[postId];
}

export function setLikes(postId: string, value: number): number {
	const data = read();
	data.likes[postId] = value;
	write(data);
	return value;
}
