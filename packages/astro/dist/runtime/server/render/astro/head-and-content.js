const headAndContentSym = /* @__PURE__ */ Symbol.for('astro.headAndContent');
function isHeadAndContent(obj) {
	return typeof obj === 'object' && obj !== null && !!obj[headAndContentSym];
}
function createHeadAndContent(head, content) {
	return {
		[headAndContentSym]: true,
		head,
		content,
	};
}
function createThinHead() {
	return {
		[headAndContentSym]: true,
	};
}
export { createHeadAndContent, createThinHead, isHeadAndContent };
