// Detect this in comments, both in .astro components and in js/ts files.
// Keep behavior aligned with the existing plugin usage.
const HEAD_INJECT_COMMENT_EXP = /(?:^\/\/|\/\/!)\s*astro-head-inject/;

export function hasHeadInjectComment(source: string): boolean {
	return HEAD_INJECT_COMMENT_EXP.test(source);
}
