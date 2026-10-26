// Rewrites .astro source before Astro's compiler sees it:
//
// - `<script scoped>` becomes a normal (bundled) script that registers its
//   body with the client runtime, which runs it once per component instance
//   with a `scope` function bound to that instance.
// - Components with a scoped script get comment markers around their
//   template (and around each <slot>), so the runtime can tell which elements
//   belong to which instance.
// - `{expr}` text and `attr={expr}` on HTML elements go through helpers that
//   leave ordinary values alone, but render signals with binding markers so
//   the client can revive them (shared by id) and keep the DOM in sync.
import { createHash } from 'node:crypto';
import { parse } from '@astrojs/compiler-rs';

export const RUNTIME = '@astrojs/ui/client';
const SERVER = '@astrojs/ui/server';

// The parts of the compiler's (oxc-style) AST used here.
interface AstNode {
	type: string;
	start: number;
	end: number;
	[key: string]: any;
}

interface Edit {
	start: number;
	end: number;
	text: string;
}

const marker = (comment: string) => `<Fragment set:html="<!--${comment}-->" />`;

export async function transformAstro(source: string, file: string): Promise<string> {
	const { ast } = (await parse(source)) as unknown as {
		ast: { frontmatter?: AstNode; body: AstNode[] };
	};
	const edits: Edit[] = [];
	const isPage = /(?:^|\/)src\/pages\//.test(file);
	const cid = createHash('sha256').update(file).digest('hex').slice(0, 8);
	const name = file
		.split('/')
		.pop()!
		.replace(/\.astro$/, '');

	let hasScoped = false;
	let hasHtml = false;
	const slots: AstNode[] = [];

	walk(ast.body, (node) => {
		if (node.type === 'JSXElement') {
			const tag = node.openingElement.name;
			const tagName: string = tag.type === 'JSXIdentifier' ? tag.name : '';
			if (tagName === 'html') hasHtml = true;
			if (tagName === 'script' && hasAttr(node, 'scoped')) {
				hasScoped = true;
				edits.push(scopedScript(source, node, isPage ? null : cid, name));
				return false;
			}
			if (tagName === 'script' || tagName === 'style') return false;
			if (tagName === 'slot') slots.push(node);
			if (isHtmlElement(tagName)) {
				for (const attr of node.openingElement.attributes) bindAttr(source, attr, edits);
			}
		} else if (node.type === 'JSXExpressionContainer') {
			// Only bare identifiers and member expressions can be signals we bind;
			// anything else (calls, maps, markup) is left untouched.
			const e = node.expression;
			if (e.type === 'Identifier' || e.type.endsWith('MemberExpression')) {
				edits.push({
					start: e.start,
					end: e.end,
					text: `__ui.text(${source.slice(e.start, e.end)})`,
				});
			}
		}
	});

	if (hasScoped && !isPage && !hasHtml) {
		const start = ast.frontmatter ? ast.frontmatter.end : 0;
		edits.push({ start, end: start, text: marker(`ui:i ${cid}`) });
		edits.push({ start: source.length, end: source.length, text: marker('/ui:i') });
		for (const slot of slots) {
			edits.push({ start: slot.start, end: slot.start, text: marker('ui:s') });
			edits.push({ start: slot.end, end: slot.end, text: marker('/ui:s') });
		}
	}

	if (!edits.length) return source;

	// Make the server helpers available to the template.
	const helper = `import * as __ui from '${SERVER}';\n`;
	if (ast.frontmatter) {
		const fmStart = source.indexOf('---') + 3;
		edits.push({ start: fmStart, end: fmStart, text: `\n${helper}` });
	} else {
		edits.push({ start: 0, end: 0, text: `---\n${helper}---\n` });
	}

	return applyEdits(source, edits);
}

function bindAttr(source: string, attr: AstNode, edits: Edit[]) {
	if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') return;
	const value = attr.value;
	if (!value || value.type !== 'JSXExpressionContainer') return;
	const name: string = attr.name.name;
	if (name.includes(':') || name.startsWith('on')) return;
	const code = source.slice(value.expression.start, value.expression.end);
	edits.push({
		start: attr.start,
		end: attr.end,
		text: `${name}={__ui.val(${code})} data-ui-a-${name}={__ui.bind(${code})}`,
	});
}

const IMPORT_RE = /^[ \t]*import\b[^;]*?['"][^'"\n]+['"];?[ \t]*$/gm;

function scopedScript(source: string, node: AstNode, cid: string | null, name: string): Edit {
	const body = source.slice(node.openingElement.end, node.closingElement.start);

	// Imports have to stay at module top level; everything else runs per instance.
	const imports: string[] = [];
	const rest = body.replace(IMPORT_RE, (m) => {
		imports.push(m.trim());
		return '';
	});

	const text =
		`<script>\n` +
		`import { __register } from '${RUNTIME}';\n` +
		imports.join('\n') +
		`\n__register(${JSON.stringify(cid)}, ${JSON.stringify(name)}, (scope) => {${rest}});\n` +
		`</script>`;
	return { start: node.start, end: node.end, text };
}

function hasAttr(node: AstNode, name: string) {
	return node.openingElement.attributes.some(
		(a: AstNode) => a.type === 'JSXAttribute' && a.name.name === name,
	);
}

function isHtmlElement(tag: string) {
	return /^[a-z][a-z0-9-]*$/.test(tag) && tag !== 'slot';
}

function walk(nodes: AstNode[], visit: (node: AstNode) => boolean | void) {
	for (const node of nodes) {
		if (!node || typeof node !== 'object') continue;
		if (visit(node) === false) continue;
		if (node.children) walk(node.children, visit);
		// Markup nested in expressions, e.g. {items.map(i => <li>{i.name}</li>)}
		if (node.type === 'JSXExpressionContainer') walkExpression(node.expression, visit);
	}
}

function walkExpression(expr: unknown, visit: (node: AstNode) => boolean | void) {
	if (!expr || typeof expr !== 'object') return;
	for (const v of Object.values(expr)) {
		for (const child of Array.isArray(v) ? v : [v]) {
			if (!child || typeof child !== 'object') continue;
			if (child.type === 'JSXElement' || child.type === 'JSXFragment') walk([child], visit);
			else walkExpression(child, visit);
		}
	}
}

function applyEdits(source: string, edits: Edit[]) {
	// Inserts at the same offset keep their order; replacements never overlap.
	const sorted = edits.map((e, i) => ({ ...e, i })).sort((a, b) => b.start - a.start || b.i - a.i);
	let out = source;
	for (const e of sorted) out = out.slice(0, e.start) + e.text + out.slice(e.end);
	return out;
}
