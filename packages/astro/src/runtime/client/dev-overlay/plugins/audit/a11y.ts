// This file is adapted from the [Svelte](https://github.com/sveltejs/svelte) repository
// Specifically https://github.com/sveltejs/svelte/blob/d57eff76ed24ae2330f11f3d3938761ae4e14b4b/packages/svelte/src/compiler/phases/2-analyze/a11y.js

// This code is licensed under the MIT License per https://github.com/sveltejs/svelte/blob/d57eff76ed24ae2330f11f3d3938761ae4e14b4b/LICENSE.md
// See [Astro's LICENSE](https://github.com/withastro/astro/blob/main/LICENSE) for more information.
import type { AuditRuleWithSelector } from './index.js';
import { roles } from 'aria-query';
// @ts-expect-error package does not provide types
import { AXObjectRoles, elementAXObjects } from 'axobject-query';


const a11y_required_attributes = {
	a: ['href'],
	area: ['alt', 'aria-label', 'aria-labelledby'],
	// html-has-lang
	html: ['lang'],
	// iframe-has-title
	iframe: ['title'],
	img: ['alt'],
	object: ['title', 'aria-label', 'aria-labelledby'],
};

const interactiveElements = ['button', 'details', 'embed', 'iframe', 'label', 'select', 'textarea'];

const aria_non_interactive_roles = [
	'alert',
	'alertdialog',
	'application',
	'article',
	'banner',
	'button',
	'cell',
	'checkbox',
	'columnheader',
	'combobox',
	'complementary',
	'contentinfo',
	'definition',
	'dialog',
	'directory',
	'document',
	'feed',
	'figure',
	'form',
	'grid',
	'gridcell',
	'group',
	'heading',
	'img',
	'link',
	'list',
	'listbox',
	'listitem',
	'log',
	'main',
	'marquee',
	'math',
	'menu',
	'menubar',
	'menuitem',
	'menuitemcheckbox',
	'menuitemradio',
	'navigation',
	'none',
	'note',
	'option',
	'presentation',
	'progressbar',
	'radio',
	'radiogroup',
	'region',
	'row',
	'rowgroup',
	'rowheader',
	'scrollbar',
	'search',
	'searchbox',
	'separator',
	'slider',
	'spinbutton',
	'status',
	'switch',
	'tab',
	'tablist',
	'tabpanel',
	'term',
	'textbox',
	'timer',
	'toolbar',
	'tooltip',
	'tree',
	'treegrid',
	'treeitem',
];

const a11y_required_content = [
	// anchor-has-content
	'a',
	// heading-has-content
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
];

const a11y_distracting_elements = ['blink', 'marquee'];

const a11y_nested_implicit_semantics = new Map([
	['header', 'banner'],
	['footer', 'contentinfo'],
]);
const a11y_implicit_semantics = new Map([
	['a', 'link'],
	['area', 'link'],
	['article', 'article'],
	['aside', 'complementary'],
	['body', 'document'],
	['button', 'button'],
	['datalist', 'listbox'],
	['dd', 'definition'],
	['dfn', 'term'],
	['dialog', 'dialog'],
	['details', 'group'],
	['dt', 'term'],
	['fieldset', 'group'],
	['figure', 'figure'],
	['form', 'form'],
	['h1', 'heading'],
	['h2', 'heading'],
	['h3', 'heading'],
	['h4', 'heading'],
	['h5', 'heading'],
	['h6', 'heading'],
	['hr', 'separator'],
	['img', 'img'],
	['li', 'listitem'],
	['link', 'link'],
	['main', 'main'],
	['menu', 'list'],
	['meter', 'progressbar'],
	['nav', 'navigation'],
	['ol', 'list'],
	['option', 'option'],
	['optgroup', 'group'],
	['output', 'status'],
	['progress', 'progressbar'],
	['section', 'region'],
	['summary', 'button'],
	['table', 'table'],
	['tbody', 'rowgroup'],
	['textarea', 'textbox'],
	['tfoot', 'rowgroup'],
	['thead', 'rowgroup'],
	['tr', 'row'],
	['ul', 'list'],
]);
const menuitem_type_to_implicit_role = new Map([
	['command', 'menuitem'],
	['checkbox', 'menuitemcheckbox'],
	['radio', 'menuitemradio'],
]);
const input_type_to_implicit_role = new Map([
	['button', 'button'],
	['image', 'button'],
	['reset', 'button'],
	['submit', 'button'],
	['checkbox', 'checkbox'],
	['radio', 'radio'],
	['range', 'slider'],
	['number', 'spinbutton'],
	['email', 'textbox'],
	['search', 'searchbox'],
	['tel', 'textbox'],
	['text', 'textbox'],
	['url', 'textbox'],
]);

const ariaAttributes = new Set(
	'activedescendant atomic autocomplete busy checked colcount colindex colspan controls current describedby description details disabled dropeffect errormessage expanded flowto grabbed haspopup hidden invalid keyshortcuts label labelledby level live modal multiline multiselectable orientation owns placeholder posinset pressed readonly relevant required roledescription rowcount rowindex rowspan selected setsize sort valuemax valuemin valuenow valuetext'.split(
		' '
	)
);

const ariaRoles = new Set(
	'alert alertdialog application article banner button cell checkbox columnheader combobox complementary contentinfo definition dialog directory document feed figure form grid gridcell group heading img link list listbox listitem log main marquee math menu menubar menuitem menuitemcheckbox menuitemradio navigation none note option presentation progressbar radio radiogroup region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton status tab tablist tabpanel textbox timer toolbar tooltip tree treegrid treeitem'.split(
		' '
	)
);

export const a11y: AuditRuleWithSelector[] = [
	{
		code: 'a11y-accesskey',
		title: 'Avoid using `accesskey`',
		message:
			"The `accesskey` attribute can cause accessibility issues. The shortcuts can conflict with the browser's or operating system's shortcuts, and they are difficult for users to discover and use.",
		selector: '[accesskey]',
	},
	{
		code: 'a11y-aria-activedescendant-has-tabindex',
		title: 'Elements with attribute `aria-activedescendant` must be tabbable',
		message:
			'This element must either have an inherent `tabindex` or declare `tabindex` as an attribute.',
		selector: '[aria-activedescendant]',
		match(element) {
			if (!(element as HTMLElement).tabIndex && !element.hasAttribute('tabindex')) return true;
		},
	},
	{
		code: 'a11y-aria-attributes',
		title: 'Element does not support ARIA roles.',
		message: 'Elements like `meta`, `html`, `script`, `style` do not support having ARIA roles.',
		selector: ':is(meta, html, script, style)[role]',
		match(element) {
			for (const attribute of element.attributes) {
				if (attribute.name.startsWith('aria-')) return true;
			}
		},
	},
	{
		code: 'a11y-autofocus',
		title: 'Avoid using `autofocus`',
		message:
			'The `autofocus` attribute can cause accessibility issues, as it can cause the focus to move around unexpectedly for screen reader users.',
		selector: '[autofocus]',
	},
	{
		code: 'a11y-distracting-elements',
		title: 'Distracting elements should not be used',
		message:
			'Elements that can be visually distracting like `<marquee>` or `<blink>` can cause accessibility issues for visually impaired users and should be avoided.',
		selector: `:is(${a11y_distracting_elements.join(',')})`,
	},
	{
		code: 'a11y-hidden',
		title: 'Certain DOM elements are useful for screen reader navigation and should not be hidden',
		message: (element) => `${element.localName} element should not be hidden.`,
		selector: '[aria-hidden]:is(h1,h2,h3,h4,h5,h6)',
	},
	{
		code: 'a11y-img-redundant-alt',
		title: 'Redundant text in alt attribute',
		message:
			'Screen readers already announce `img` elements as an image. There is no need to use words such as "image", "photo", and/or "picture".',
		selector: 'img[alt]:not([aria-hidden])',
		match: (img: HTMLImageElement) => /\b(image|picture|photo)\b/i.test(img.alt),
	},
	{
		code: 'a11y-incorrect-aria-attribute-type',
		title: 'Incorrect value for ARIA attribute.',
		message: '`aria-hidden` should only receive a boolean.',
		selector: '[aria-hidden]',
		match(element) {
			const value = element.getAttribute('aria-hidden');
			if (!value) return true;
			if (!['true', 'false'].includes(value)) return true;
		},
	},
	{
		code: 'a11y-invalid-attribute',
		title: 'Attributes important for accessibility should have a valid value',
		message: "`href` should not be empty, `'#'`, or `javascript:`.",
		selector: 'a[href]:is([href=""], [href="#"], [href^="javascript:" i])',
	},
	{
		code: 'a11y-label-has-associated-control',
		title: '`label` tag should have an associated control and a text content.',
		message:
			'The `label` tag must be associated with a control using either `for` or having a nested input. Additionally, the `label` tag must have text content.',
		selector: 'label:not([for])',
		match(element) {
			const inputChild = element.querySelector('input');
			if (!inputChild?.textContent) return true;
		},
	},
	{
		code: 'a11y-media-has-caption',
		title: 'Unmuted video elements should have captions',
		message:
			'Videos without captions can be difficult for deaf and hard-of-hearing users to follow along with. If the video does not need captions, add the `muted` attribute.',
		selector: 'video:not([muted])',
		match(element) {
			const tracks = element.querySelectorAll('track');
			if (!tracks.length) return true;

			const hasCaptionTrack = Array.from(tracks).some(
				(track) => track.getAttribute('kind') === 'captions'
			);

			return !hasCaptionTrack;
		},
	},
	{
		code: 'a11y-misplaced-scope',
		title: 'The `scope` attribute should only be used on `<th>` elements',
		message:
			'The `scope` attribute tells the browser and screen readers how to navigate tables. In HTML5, it should only be used on `<th>` elements.',
		selector: ':not(th)[scope]',
	},
	{
		code: 'a11y-missing-attribute',
		title: 'Required attributes missing.',
		message: (element) => {
			const requiredAttributes =
				a11y_required_attributes[element.localName as keyof typeof a11y_required_attributes];

			const missingAttributes = requiredAttributes.filter(
				(attribute) => !element.hasAttribute(attribute)
			);

			return `${
				element.localName
			} element is missing required attributes for accessibility: ${missingAttributes.join(', ')} `;
		},
		selector: Object.keys(a11y_required_attributes).join(','),
		match(element) {
			const requiredAttributes =
				a11y_required_attributes[element.localName as keyof typeof a11y_required_attributes];

			if (!requiredAttributes) return true;
			for (const attribute of requiredAttributes) {
				if (!element.hasAttribute(attribute)) return true;
			}

			return false;
		},
	},
	{
		code: 'a11y-missing-content',
		title: 'Missing content on element important for accessibility',
		message: 'Headings and anchors must have content to be accessible.',
		selector: a11y_required_content.join(','),
		match(element) {
			if (!element.textContent) return true;
		},
	},
	{
		code: 'a11y-no-redundant-roles',
		title: 'HTML element has redundant ARIA roles',
		message:
			'Giving these elements an ARIA role that is already set by the browser has no effect and is redundant.',
		selector: [...a11y_implicit_semantics.keys()].join(','),
		match(element) {
			const role = element.getAttribute('role');

			if (element.localName === 'input') {
				const type = element.getAttribute('type');
				if (!type) return true;

				const implicitRoleForType = input_type_to_implicit_role.get(type);
				if (!implicitRoleForType) return true;

				if (role === implicitRoleForType) return false;
			}

			// TODO: Handle menuitem and elements that inherit their role from their parent

			const implicitRole = a11y_implicit_semantics.get(element.localName);
			if (!implicitRole) return true;

			if (role === implicitRole) return false;
		},
	},
	{
		code: 'a11y-no-interactive-element-to-noninteractive-role',
		title: 'Non-interactive ARIA role used on interactive HTML element.',
		message:
			'Interactive HTML elements like `<a>` and `<button>` cannot use non-interactive roles like `heading`, `list`, `menu`, and `toolbar`.',
		selector: `[role]:is(${interactiveElements.join(',')})`,
		match(element) {
			const role = element.getAttribute('role');
			if (!role) return false;
			if (!ariaRoles.has(role)) return false;

			if (aria_non_interactive_roles.includes(role)) return true;
		},
	},
	{
		code: 'a11y-no-noninteractive-element-to-interactive-role',
		title: 'Interactive ARIA role used on non-interactive HTML element.',
		message: 'Interactive roles should not be used to convert a non-interactive element to an interactive element',
		selector: `[role]:not(${interactiveElements.join(',')})`,
		match(element) {
			const role = element.getAttribute('role');
			if (!role) return false;
			if (!ariaRoles.has(role)) return false;
			const exceptions = a11y_non_interactive_element_to_interactive_role_exceptions[element.localName as keyof typeof a11y_non_interactive_element_to_interactive_role_exceptions];
			if (exceptions?.includes(role)) return false;

			if (!aria_non_interactive_roles.includes(role)) return true;
		},
	},
	{
		code: 'a11y-no-noninteractive-tabindex',
		title: 'Invalid `tabindex` on non-interactive element',
		message:
			'Non-interactive elements should not have `tabindex` greater than zero or `tabindex="-1"`',
		selector: '[tabindex]',
		match(element) {
			if (!interactiveElements.includes(element.localName)) return true;
		},
	},
	{
		code: 'a11y-positive-tabindex',
		title: 'Avoid positive `tabindex` property values',
		message:
			'This will move elements out of the expected tab order, creating a confusing experience for keyboard users.',
		selector: '[tabindex]:not([tabindex="-1"]):not([tabindex="0"])',
	},
	{
		code: 'a11y-role-has-required-aria-props',
		title: 'Missing attributes required for ARIA role',
		message: (element) => {
			const { __astro_role: role, __astro_missing_attributes: required } = element as any;
			return `${
				element.localName
			} element is missing required attributes for its role (${role}): ${required.join(', ')} `;
		},
		selector: "*",
		match(element) {
			let role: import('aria-query').ARIARoleDefinitionKey | undefined;
			if (element.hasAttribute('role')) {
				role = element.getAttribute('role')! as any;
			} else {
				role = getImplicitRole(element) as any;
			}
			if (!role) return false;
			if (is_semantic_role_element(role, element.localName, getAttributeObject(element))) {
				return;
			}
			const { requiredProps } = roles.get(role)!;
			const required_role_props = Object.keys(requiredProps);
			const missingProps = required_role_props.filter((prop) => (element as any)[prop] === undefined)
			if (missingProps.length > 0) {
				(element as any).__astro_role = role;
				(element as any).__astro_missing_attributes = missingProps;
				return true;
			}
		}
	},
	// TODO: Implement this rule
	// {
	// 	code: 'a11y-role-supports-aria-props',
	// 	title:
	// 		'Elements with explicit or implicit roles defined contain only `aria-*` properties supported by that role',
	// 	message: 'For example',
	// 	selector: "div[role='link'][aria-multiline]",
	// },
	{
		code: 'a11y-structure',
		title: 'Invalid DOM structure',
		message:
			'The DOM structure must be valid for accessibility of the page, for example `figcaption` must be a direct child of `figure`.',
		selector: 'figcaption:not(figure > figcaption)',
	},
	{
		code: 'a11y-unknown-aria-attribute',
		title: 'Unknown ARIA attribute',
		message: 'ARIA attributes prefixed with `aria-` must be valid, non-abstract ARIA attributes.',
		selector: '*',
		match(element) {
			for (const attribute of element.attributes) {
				if (attribute.name.startsWith('aria-')) {
					console.log(attribute.name, ariaAttributes.has(attribute.name.slice('aria-'.length)));
					if (!ariaAttributes.has(attribute.name.slice('aria-'.length))) return true;
				}
			}
		},
	},
	{
		code: 'a11y-unknown-role',
		title: 'Unknown ARIA role',
		message: 'ARIA roles must be valid, non-abstract ARIA roles.',
		selector: '[role]',
		match(element) {
			const role = element.getAttribute('role');
			if (!role) return true;
			if (!ariaRoles.has(role)) return true;
		},
	},
];

const a11y_labelable = [
	'button',
	'input',
	'keygen',
	'meter',
	'output',
	'progress',
	'select',
	'textarea',
];

/**
 * Exceptions to the rule which follows common A11y conventions
 * TODO make this configurable by the user
 * @type {Record<string, string[]>}
 */
const a11y_non_interactive_element_to_interactive_role_exceptions = {
	ul: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
	ol: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
	li: ['menuitem', 'option', 'row', 'tab', 'treeitem'],
	table: ['grid'],
	td: ['gridcell'],
	fieldset: ['radiogroup', 'presentation'],
};

const combobox_if_list = ['email', 'search', 'tel', 'text', 'url'];
function input_implicit_role(attributes: Record<string, string>) {
	if (!('type' in attributes)) return;
	const { type, list } = attributes;
	if (!type) return;
	if (list && combobox_if_list.includes(type)) {
		return 'combobox';
	}
	return input_type_to_implicit_role.get(type);
}

/** @param {Map<string, import('#compiler').Attribute>} attribute_map */
function menuitem_implicit_role(attributes: Record<string, string>) {
	if (!('type' in attributes)) return;
	const { type } = attributes;
	if (!type) return;
	return menuitem_type_to_implicit_role.get(type);
}

function getImplicitRole(element: Element) {
	const name = element.localName;
	const attrs = getAttributeObject(element);
	if (name === 'menuitem') {
		return menuitem_implicit_role(attrs);
	} else if (name === 'input') {
		return input_implicit_role(attrs);
	} else {
		return a11y_implicit_semantics.get(name);
	}
}

function getAttributeObject(element: Element): Record<string, string> {
	let obj: Record<string, string> = {};
	for (let i = 0; i < element.attributes.length; i++) {
		const attribute = element.attributes.item(i)!;
		obj[attribute.name] = attribute.value;
	}
	return obj;
}

/**
 * @param {import('aria-query').ARIARoleDefinitionKey} role
 * @param {string} tag_name
 * @param {Map<string, import('#compiler').Attribute>} attribute_map
 */
function is_semantic_role_element(role: string, tag_name: string, attributes: Record<string, string>) {
	for (const [schema, ax_object] of elementAXObjects.entries()) {
		if (
			schema.name === tag_name &&
			(!schema.attributes || schema.attributes.every((attr: any) => attributes[attr.name] === attr.value))
		) {
			for (const name of ax_object) {
				const axRoles = AXObjectRoles.get(name);
				if (axRoles) {
					for (const { name: _name } of axRoles) {
						if (_name === role) {
							return true;
						}
					}
				}
			}
		}
	}
	return false;
}
