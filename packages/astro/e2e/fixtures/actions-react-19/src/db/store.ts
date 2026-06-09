// In-memory store backing the demo actions. It lives on `globalThis` so the value is
// shared across every module instance the dev server evaluates: the page render and the
// action handler run in separate module graphs, so a plain module-level value would not
// be shared between them. This mirrors how the previous SQLite-backed store behaved.
// Re-evaluating this module re-seeds the data, which the e2e tests trigger between runs
// by touching this file (see the `afterEach` in actions-react-19.test.ts).

interface Store {
	likes: Map<string, number>;
}

declare global {
	// eslint-disable-next-line no-var
	var __actionsReact19Store: Store | undefined;
}

// Re-seed on every evaluation so touching this file resets state between tests.
globalThis.__actionsReact19Store = {
	likes: new Map([['first-post', 10]]),
};

function store(): Store {
	return globalThis.__actionsReact19Store!;
}

export function getLikes(postId: string): number {
	return store().likes.get(postId) ?? 0;
}

export function incrementLikes(postId: string): number {
	const next = getLikes(postId) + 1;
	store().likes.set(postId, next);
	return next;
}

export function setLikes(postId: string, value: number): number {
	store().likes.set(postId, value);
	return value;
}
