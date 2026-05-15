const HEAD_INJECT_COMMENT_EXP = /(?:^\/\/|\/\/!)\s*astro-head-inject/;
function hasHeadInjectComment(source) {
	return HEAD_INJECT_COMMENT_EXP.test(source);
}
export { hasHeadInjectComment };
