import { fromHtml } from 'hast-util-from-html';
import { toText } from 'hast-util-to-text';
import { removePosition } from 'unist-util-remove-position';
import { visitParents } from 'unist-util-visit-parents';
const languagePattern = /\blanguage-(\S+)\b/;
const defaultExcludeLanguages = ['math'];
async function highlightCodeBlocks(tree, highlighter, excludeLanguages = []) {
	const nodes = [];
	visitParents(tree, { type: 'element', tagName: 'code' }, (node, ancestors) => {
		const parent = ancestors.at(-1);
		if (parent?.type !== 'element' || parent.tagName !== 'pre') {
			return;
		}
		if (parent.children.length !== 1) {
			return;
		}
		let languageMatch;
		let { className } = node.properties;
		if (typeof className === 'string') {
			languageMatch = languagePattern.exec(className);
		} else if (Array.isArray(className)) {
			for (const cls of className) {
				if (typeof cls !== 'string') {
					continue;
				}
				languageMatch = languagePattern.exec(cls);
				if (languageMatch) {
					break;
				}
			}
		}
		const language = languageMatch?.[1] || 'plaintext';
		if (excludeLanguages.includes(language) || defaultExcludeLanguages.includes(language)) {
			return;
		}
		nodes.push({
			node,
			language,
			parent,
			grandParent: ancestors.at(-2),
		});
	});
	for (const { node, language, grandParent, parent } of nodes) {
		const meta = node.data?.meta ?? node.properties.metastring ?? void 0;
		const code = toText(node, { whitespace: 'pre' });
		const result = await highlighter(code, language, { meta });
		let replacement;
		if (typeof result === 'string') {
			replacement = fromHtml(result, { fragment: true }).children[0];
			removePosition(replacement);
		} else {
			replacement = result.children[0];
		}
		const index = grandParent.children.indexOf(parent);
		grandParent.children[index] = replacement;
	}
}
export { defaultExcludeLanguages, highlightCodeBlocks };
