import type * as vite from 'vite';

import htmlparser2 from 'htmlparser2';

/** Inject tags into HTML (note: for best performance, group as many tags as possible into as few calls as you can) */
export function injectTags(html: string, tags: vite.HtmlTagDescriptor[]): string {
	let output = html;
	if (!tags.length) return output;

	const pos = { 'head-prepend': -1, head: -1, 'body-prepend': -1, body: -1 };

	// parse html
	const parser = new htmlparser2.Parser({
		onopentag(tagname) {
			if (tagname === 'head') pos['head-prepend'] = parser.endIndex + 1;
			if (tagname === 'body') pos['body-prepend'] = parser.endIndex + 1;
		},
		onclosetag(tagname) {
			if (tagname === 'head') pos['head'] = parser.startIndex;
			if (tagname === 'body') pos['body'] = parser.startIndex;
		},
	});
	parser.write(html);
	parser.end();

	// inject
	const lastToFirst = Object.entries(pos).sort((a, b) => b[1] - a[1]);
	lastToFirst.forEach(([name, i]) => {
		if (i === -1) {
			// if page didn’t generate <head> or <body>, guess
			if (name === 'head-prepend' || name === 'head') i = 0;
			if (name === 'body-prepend' || name === 'body') i = html.length;
		}
		let selected = tags.filter(({ injectTo }) => {
			if (name === 'head-prepend' && !injectTo) {
				return true; // "head-prepend" is the default
			} else {
				return injectTo === name;
			}
		});
		if (!selected.length) return;
		output = output.substring(0, i) + serializeTags(selected) + html.substring(i);
	});

	return output;
}

type Resource = Record<string, string>;

/** Collect resources (scans final, rendered HTML so expressions have been applied) */
export function collectResources(html: string): Resource[] {
	let resources: Resource[] = [];
	const parser = new htmlparser2.Parser({
		// <link> tags are self-closing, so only use onopentag (avoid onattribute or onclosetag)
		onopentag(tagname, attrs) {
			if (tagname === 'link') resources.push(attrs);
		},
	});
	parser.write(html);
	parser.end();
	return resources;
}

// -------------------------------------------------------------------------------
// Everything below © Vite. Rather than invent our own tag creating API, we borrow
// Vite’s `transformIndexHtml()` API for ease-of-use and consistency. But we need
// to borrow a few private methods in Vite to make that available here.
// https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/html.ts
//
// See LICENSE for more info.
// -------------------------------------------------------------------------------

const unaryTags = new Set(['link', 'meta', 'base']);

function serializeTag({ tag, attrs, children }: vite.HtmlTagDescriptor, indent = ''): string {
	if (unaryTags.has(tag)) {
		return `<${tag}${serializeAttrs(attrs)}>`;
	} else {
		return `<${tag}${serializeAttrs(attrs)}>${serializeTags(
			children,
			incrementIndent(indent)
		)}</${tag}>`;
	}
}

function serializeTags(tags: vite.HtmlTagDescriptor['children'], indent = ''): string {
	if (typeof tags === 'string') {
		return tags;
	} else if (tags && tags.length) {
		return tags.map((tag) => `${indent}${serializeTag(tag, indent)}\n`).join('');
	}
	return '';
}

function serializeAttrs(attrs: vite.HtmlTagDescriptor['attrs']): string {
	let res = '';
	for (const key in attrs) {
		if (typeof attrs[key] === 'boolean') {
			res += attrs[key] ? ` ${key}` : ``;
		} else {
			res += ` ${key}=${JSON.stringify(attrs[key])}`;
		}
	}
	return res;
}

function incrementIndent(indent = '') {
	return `${indent}${indent[0] === '\t' ? '\t' : '  '}`;
}
