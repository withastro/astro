import { visit } from 'estree-util-visit';
import { html, svg } from 'property-information';
import { htmlVoidElements } from 'html-void-elements';
import type { Options } from 'hast-util-to-html';
import type { State as HtmlState } from 'hast-util-to-html/lib/types';
import { zwitch } from 'zwitch';
import { comment } from 'hast-util-to-html/lib/handle/comment.js';
import { doctype } from 'hast-util-to-html/lib/handle/doctype.js';
import { element } from 'hast-util-to-html/lib/handle/element.js';
import { raw } from 'hast-util-to-html/lib/handle/raw.js';
import { root } from 'hast-util-to-html/lib/handle/root.js';
import { text } from 'hast-util-to-html/lib/handle/text.js';
import { resolvePath } from './utils.js';

interface State extends HtmlState {
	tree: any;
	importer: string;
	metadata: any;
}

type Handler = (node: any, index: number | undefined, parent: any, state: State) => string;

const mdxJsxFlowElement: Handler = (node, index, parent, state) => {
	if (node.name.includes('.') || node.name.match(/^[A-Z]/)) {
		const clientAttribute = node.attributes.find((attr: any) => attr.name.startsWith('client:'));
		const clientValue = clientAttribute ? clientAttribute.name.slice(7) : undefined;

		let extraAttrs: string[] = [];
		if (clientValue) {
			extraAttrs.push(`"client:component-hydration":"${clientValue}"`);

			for (const rootChild of state.tree.children) {
				if (rootChild.type === 'mdxjsEsm') {
					const ast = rootChild.data.estree;
					visit(ast, (n: any) => {
						if (n.type === 'ImportDeclaration') {
							const specifier = n.specifiers.find((s: any) => s.local.name === node.name);
							if (!specifier) return;

							const component = {
								exportName: specifier.imported ? specifier.imported.name : 'default',
								specifier: n.source.value,
								resolvedPath: resolvePath(n.source.value, state.importer),
							};

							// $$metadata.resolvePath will be postprocessed in Vite plugin later
							extraAttrs.push(`"client:component-path":${JSON.stringify(component.resolvedPath)}`);
							extraAttrs.push(`"client:component-export":${JSON.stringify(component.exportName)}`);

							if (clientValue === 'only') {
								state.metadata.clientOnlyComponents.push(component);
							} else {
								state.metadata.hydratedComponents.push(component);
							}
						}
					});
				}
			}
		}

		const slots: string[] = [];
		const rootNode =
			state.schema.space === 'html' && node.tagName === 'template' ? node.content : node;
		{
			const children = rootNode.children || [];
			let defaultSlot = [];
			let index = -1;

			while (++index < children.length) {
				const child = children[index];
				const slotName = child.attributes?.find((a) => a.name === 'slot')?.value?.trim();
				if (slotName && slotName !== 'default') {
					slots.push(
						`"${slotName}": () => $$render\`${state.one.call(state, child, index, rootNode)}\``
					);
				} else {
					defaultSlot.push(state.one.call(state, child, index, rootNode));
				}
			}

			// consolidate default slot
			if (defaultSlot.length) {
				slots.push(`"default": () => $$render\`${defaultSlot.join('')}\``);
			}
		}

		const attrStr = serializeAttributesAsObjectString(node.attributes);

		return `\${$$renderComponent($$result, ${JSON.stringify(node.name)}, ${node.name}, {${
			attrStr ? attrStr + ',' : ''
		} ${extraAttrs.join(',')}}${slots.length ? `, {${slots.join(',')}}` : ''})}`;
	} else {
		return `<${node.name}${serializeAttributesAsString(node.attributes)}>${state.all(node)}</${
			node.name
		}>`;
	}
};

function serializeAttributesAsString(attributes: any[]) {
	return Object.values(attributes)
		.map((attr) => {
			// spread
			if (attr.type === 'mdxJsxExpressionAttribute') {
				const value = attr.value.trim();
				const varName = value.slice(3);
				return `\${$$spreadAttribute(varName, ${JSON.stringify(varName)})}`;
			}
			// normal attribute
			else if (attr.type === 'mdxJsxAttribute') {
				if (attr.value == null) {
					return ` ${attr.name}`;
				} else if (typeof attr.value === 'string') {
					return ` ${attr.name}="${attr.value}"`;
				} else {
					return `\${$$addAttribute(${attr.value.value}, ${JSON.stringify(attr.name)})}`;
				}
			}
		})
		.join('');
}

function serializeAttributesAsObjectString(attributes: any[]) {
	return Object.values(attributes)
		.map((attr) => {
			// spread
			if (attr.type === 'mdxJsxExpressionAttribute') {
				return attr.value;
			}
			// normal attribute
			else if (attr.type === 'mdxJsxAttribute') {
				if (attr.value == null) {
					return `${JSON.stringify(attr.name)}: true`;
				} else if (typeof attr.value === 'string') {
					return `${JSON.stringify(attr.name)}: ${JSON.stringify(attr.value)}`;
				} else {
					return `${JSON.stringify(attr.name)}: ${attr.value.value}`;
				}
			}
		})
		.join(',');
}

const mdxFlowExpression: Handler = (node, index, parent, state) => {
	const value = node.value.trim();
	if (!value || (value.startsWith('/*') && value.endsWith('*/'))) {
		return '';
	} else {
		return `\${${value}}`;
	}
};

const handle = zwitch('type', {
	invalid,
	unknown,
	handlers: {
		comment,
		doctype,
		element,
		raw,
		root,
		text,
		mdxJsxFlowElement,
		mdxJsxTextElement: mdxJsxFlowElement,
		mdxFlowExpression,
		mdxTextExpression: mdxFlowExpression,
	},
});

export function toAstroHtml(tree: any, options: Options, fullTree: any, importer: string) {
	const options_ = options || {};
	const quote = options_.quote || '"';
	const alternative = quote === '"' ? "'" : '"';

	if (quote !== '"' && quote !== "'") {
		throw new Error('Invalid quote `' + quote + '`, expected `\'` or `"`');
	}

	const state: State = {
		one,
		all,
		settings: {
			omitOptionalTags: options_.omitOptionalTags || false,
			allowParseErrors: options_.allowParseErrors || false,
			allowDangerousCharacters: options_.allowDangerousCharacters || false,
			quoteSmart: options_.quoteSmart || false,
			preferUnquoted: options_.preferUnquoted || false,
			tightAttributes: options_.tightAttributes || false,
			upperDoctype: options_.upperDoctype || false,
			tightDoctype: options_.tightDoctype || false,
			bogusComments: options_.bogusComments || false,
			tightCommaSeparatedLists: options_.tightCommaSeparatedLists || false,
			tightSelfClosing: options_.tightSelfClosing || false,
			collapseEmptyAttributes: options_.collapseEmptyAttributes || false,
			allowDangerousHtml: options_.allowDangerousHtml || false,
			voids: options_.voids || htmlVoidElements,
			characterReferences: options_.characterReferences || options_.entities || {},
			closeSelfClosing: options_.closeSelfClosing || false,
			closeEmptyElements: options_.closeEmptyElements || false,
		},
		schema: options_.space === 'svg' ? svg : html,
		quote,
		alternative,
		// Add original tree to find client: import path
		tree: fullTree,
		importer,
		metadata: {
			hydratedComponents: [],
			clientOnlyComponents: [],
			scripts: [],
			propagation: 'none',
			containsHead: false,
			pageOptions: {},
		},
	};

	// escape backticks. this would be more performant if it's done in hast-util-to-html raw
	// directly. but i don't want to reimplement it.
	visit(tree, (node) => {
		if (typeof node.value === 'string') {
			node.value = escapeTemplateLiterals(node.value);
		}
	});

	const renderCode = state.one(
		Array.isArray(tree) ? { type: 'root', children: tree } : tree,
		undefined,
		undefined
	);

	return {
		renderCode,
		metadata: state.metadata,
	};
}

function one(this: State, node: any, index: number | undefined, parent: any) {
	return handle(node, index, parent, this);
}

function all(this: State, parent: any) {
	const results: string[] = [];
	const children = (parent && parent.children) || [];
	let index = -1;

	while (++index < children.length) {
		results[index] = this.one(children[index], index, parent);
	}

	return results.join('');
}

function invalid(node: any) {
	throw new Error('Expected node, not `' + node + '`');
}

function unknown(node: any) {
	throw new Error('Cannot compile unknown node `' + node.type + '`');
}

function escapeTemplateLiterals(str: string) {
	return str.replace(/\\/g, '\\\\').replace(/\`/g, '\\`').replace(/\$\{/g, '\\${');
}
