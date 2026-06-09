// In-memory store backing the demo actions. The module-level state is re-seeded
// whenever this module is re-evaluated, which the e2e tests trigger between runs
// by touching this file (see the `afterEach` in actions-blog.test.ts).

export interface Comment {
	postId: string;
	author: string;
	body: string;
}

const likes = new Map<string, number>();
const comments: Comment[] = [];

// Seed data
likes.set('first-post', 10);
comments.push({ postId: 'first-post', author: 'Alice', body: 'Great post!' });

export function getLikes(postId: string): number {
	return likes.get(postId) ?? 0;
}

export function incrementLikes(postId: string): number {
	const next = getLikes(postId) + 1;
	likes.set(postId, next);
	return next;
}

export function getComments(postId: string): Comment[] {
	return comments.filter((comment) => comment.postId === postId);
}

export function addComment(comment: Comment): Comment {
	comments.push(comment);
	return comment;
}
