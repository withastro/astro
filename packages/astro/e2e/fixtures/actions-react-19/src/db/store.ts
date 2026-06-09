// In-memory store backing the demo actions. The module-level state is re-seeded
// whenever this module is re-evaluated, which the e2e tests trigger between runs
// by touching this file (see the `afterEach` in actions-react-19.test.ts).

const likes = new Map<string, number>();

// Seed data
likes.set('first-post', 10);

export function getLikes(postId: string): number {
	return likes.get(postId) ?? 0;
}

export function incrementLikes(postId: string): number {
	const next = getLikes(postId) + 1;
	likes.set(postId, next);
	return next;
}

export function setLikes(postId: string, value: number): number {
	likes.set(postId, value);
	return value;
}
