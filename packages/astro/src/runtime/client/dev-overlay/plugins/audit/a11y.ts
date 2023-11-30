import type { AuditRuleWithSelector } from './index.js';

// `a:not([href])`
// `area:not([alt])`
// `iframe:not([title])`
// `img:not([alt])`
// `object:not([title])`
// const a11y_required_attributes = {
// 	a: ['href'],
// 	area: ['alt', 'aria-label', 'aria-labelledby'],
// 	// html-has-lang
// 	html: ['lang'],
// 	// iframe-has-title
// 	iframe: ['title'],
// 	img: ['alt'],
// 	object: ['title', 'aria-label', 'aria-labelledby']
// };

const interactiveElements = ['button', 'details', 'embed', 'iframe', 'label', 'select', 'textarea']

export const a11y: AuditRuleWithSelector[] = [
	{
		code: 'a11y-accesskey',
		title: 'Avoid using accesskey',
		message:
			'Enforce no `accesskey` on element. Access keys are HTML attributes that allow web developers to assign keyboard shortcuts to elements. Inconsistencies between keyboard shortcuts and keyboard commands used by screen reader and keyboard-only users create accessibility complications. To avoid complications, access keys should not be used.',
		selector: '[accesskey]',
	},
	{
		code: 'a11y-aria-activedescendant-has-tabindex',
		title: 'Elements with attribute `aria-activedescendant` should have `tabindex` value',
		message:
			'An element with `aria-activedescendant` must be tabbable, so it must either have an inherent `tabindex` or declare `tabindex` as an attribute.',
		selector: '[aria-activedescendant]',
		match(element) {
			console.log(element);
		},
	},
	{
		code: 'a11y-aria-attributes',
		title: 'Certain reserved DOM elements do not support ARIA roles, states and properties',
		message:
			'This is often because they are not visible, for example `meta`, `html`, `script`, `style`. This rule enforces that these DOM elements do not contain the `aria-*` props.',
		selector: ':is(meta, html, script, style)',
		match(element) {
			for (const attribute of element.attributes) {
				if (attribute.name.startsWith('aria-')) return true;
			}
		},
	},
	{
		code: 'a11y-autofocus',
		title: 'Enforce that `autofocus` is not used on elements',
		message:
			'Autofocusing elements can cause usability issues for sighted and non-sighted users alike.',
		selector: '[autofocus]',
	},
	{
		code: 'a11y-distracting-elements',
		title: 'Enforces that no distracting elements are used',
		message:
			'Elements that can be visually distracting can cause accessibility issues with visually impaired users. Such elements are most likely deprecated, and should be avoided. The following elements are visually distracting: `<marquee>` and `<blink>`.',
		selector: ':is(marquee, blink)',
	},
	{
		code: 'a11y-hidden',
		title: 'Certain DOM elements are useful for screen reader navigation and should not be hidden',
		message: (element) => `${element.localName} element should not be hidden`,
		selector: '[aria-hidden]:is(h1,h2,h3,h4,h5,h6)',
	},
	{
		code: 'a11y-img-redundant-alt',
		title: 'Redundant alt attribute',
		message:
			'Screen readers already announce `img` elements as an image. There is no need to use words such as _image_, _photo_, and/or _picture_.',
		selector: 'img[alt]:not([aria-hidden])',
		match: (img: HTMLImageElement) => /\b(image|picture|photo)\b/i.test(img.alt)
	},
	{
		code: 'a11y-incorrect-aria-attribute-type',
		title: 'Enforce that only the correct type of value is used for aria attributes',
		message: 'For example, `aria-hidden` should only receive a boolean.',
		selector: '[aria-hidden]',
	},
	{
		code: 'a11y-invalid-attribute',
		title: 'Enforce that attributes important for accessibility have a valid value',
		message: "For example, `href` should not be empty, `'#'`, or `javascript:`.",
		selector: "a[href='']",
	},
	{
		code: 'a11y-interactive-supports-focus',
		title:
			'Enforce that elements with an interactive role and interactive handlers (mouse or key press) must be focusable or tabbable',
		message: 'For example',
		selector: "div[role='button'][keypress]",
	},
	{
		code: 'a11y-label-has-associated-control',
		title: 'Enforce that a label tag has a text label and an associated control',
		message: 'There are two supported ways to associate a label with a control:',
		selector: "label[for='id']",
	},
	{
		code: 'a11y-media-has-caption',
		title: 'Providing captions for media is essential for deaf users to follow along',
		message:
			'Captions should be a transcription or translation of the dialogue, sound effects, relevant musical cues, and other relevant audio information. Not only is this important for accessibility, but can also be useful for all users in the case that the media is unavailable (similar to `alt` text on an image when an image is unable to load). The captions should contain all important and relevant information to understand the corresponding media. This may mean that the captions are not a 1:1 mapping of the dialogue in the media content. However, captions are not necessary for video components with the `muted` attribute.',
		selector: "video track[kind='captions']",
	},
	{
		code: 'a11y-misplaced-role',
		title: 'Certain reserved DOM elements do not support ARIA roles, states and properties',
		message:
			'This is often because they are not visible, for example `meta`, `html`, `script`, `style`. This rule enforces that these DOM elements do not contain the `role` props.',
		selector: "meta[role='tooltip']",
	},
	{
		code: 'a11y-misplaced-scope',
		title: 'The scope attribute should only be used on `<th>` elements',
		message: 'The scope attribute should only be used on `<th>` elements.',
		selector: "div[scope='row']",
	},
	{
		code: 'a11y-missing-attribute',
		title: 'Enforce that attributes required for accessibility are present on an element',
		message: 'The HTML element should include a "lang" attribute',
		selector: 'a:not([href])',
	},
	{
		code: 'a11y-missing-content',
		title: 'Enforce that heading elements (`h1`, `h2`, etc.) and anchors have content',
		message: 'and that the content is accessible to screen readers',
		selector: "a[href='/foo']",
	},
	{
		code: 'a11y-mouse-events-have-key-events',
		title: 'Enforce that `mouseover` and `mouseout` are accompanied by `focus` and `blur`',
		message:
			'This helps to ensure that any functionality triggered by these mouse events is also accessible to keyboard users.',
		selector: 'div[mouseover]',
	},
	{
		code: 'a11y-no-redundant-roles',
		title: 'Some HTML elements have default ARIA roles',
		message:
			'Giving these elements an ARIA role that is already set by the browser has no effect and is redundant.',
		selector: "button[role='button']",
	},
	{
		code: 'a11y-no-interactive-element-to-noninteractive-role',
		title:
			'[WAI-ARIA](https://www.w3.org/TR/wai-aria-1.1/#usage_intro) roles should not be used to convert an interactive element to a non-interactive element',
		message:
			'Non-interactive ARIA roles include `article`, `banner`, `complementary`, `img`, `listitem`, `main`, `region` and `tooltip`.',
		selector: "textarea[role='listitem']",
	},
	{
		code: 'a11y-no-noninteractive-element-interactions',
		title: 'A non-interactive element does not support event handlers (mouse and key handlers)',
		message:
			'Non-interactive elements include `<main>`, `<area>`, `<h1>` (,`<h2>`, etc), `<p>`, `<img>`, `<li>`, `<ul>` and `<ol>`. Non-interactive [WAI-ARIA roles](https://www.w3.org/TR/wai-aria-1.1/#usage_intro) include `article`, `banner`, `complementary`, `img`, `listitem`, `main`, `region` and `tooltip`.',
		selector: 'li[click]',
	},
	{
		code: 'a11y-no-noninteractive-element-to-interactive-role',
		title:
			'[WAI-ARIA](https://www.w3.org/TR/wai-aria-1.1/#usage_intro) roles should not be used to convert a non-interactive element to an interactive element',
		message:
			'Interactive ARIA roles include `button`, `link`, `checkbox`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `option`, `radio`, `searchbox`, `switch` and `textbox`.',
		selector: "h3[role='searchbox']",
	},
	{
		code: 'a11y-no-noninteractive-tabindex',
		title:
			'Tab key navigation should be limited to elements on the page that can be interacted with',
		message: 'This is to avoid confusing experiences for keyboard users.',
		selector: "[tabindex]",
	},
	{
		code: 'a11y-no-static-element-interactions',
		title: 'Elements like `<div>` with interactive handlers like `click` must have an ARIA role',
		message: 'This is to ensure accessibility for screen readers.',
		selector: 'div[click]',
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
		title: 'Elements with ARIA roles must have all required attributes for that role',
		message: 'For example',
		selector: "span[role='checkbox'][aria-labelledby='foo'][tabindex='0']",
	},
	{
		code: 'a11y-role-supports-aria-props',
		title:
			'Elements with explicit or implicit roles defined contain only `aria-*` properties supported by that role',
		message: 'For example',
		selector: "div[role='link'][aria-multiline]",
	},
	{
		code: 'a11y-structure',
		title: 'Enforce that certain DOM elements have the correct structure',
		message: 'For example',
		selector: 'div figcaption',
	},
	{
		code: 'a11y-unknown-aria-attribute',
		title: 'Enforce that only known ARIA attributes are used',
		message:
			'This is based on the [WAI-ARIA States and Properties spec](https://www.w3.org/WAI/PF/aria-1.1/states_and_properties).',
		selector: "input[type='image'][aria-labeledby='foo']",
	},
	{
		code: 'a11y-unknown-role',
		title: 'Elements with ARIA roles must use a valid, non-abstract ARIA role',
		message:
			'A reference to role definitions can be found at [WAI-ARIA](https://www.w3.org/TR/wai-aria/#role_definitions) site.',
		selector: "div[role='toooltip']",
	},
];

const ariaAttributes = new Set(
	'activedescendant atomic autocomplete busy checked colcount colindex colspan controls current describedby description details disabled dropeffect errormessage expanded flowto grabbed haspopup hidden invalid keyshortcuts label labelledby level live modal multiline multiselectable orientation owns placeholder posinset pressed readonly relevant required roledescription rowcount rowindex rowspan selected setsize sort valuemax valuemin valuenow valuetext'.split(
		' '
	)
);
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
const a11y_distracting_elements = ['blink', 'marquee'];
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
const a11y_interactive_handlers = [
	// Keyboard events
	'keypress',
	'keydown',
	'keyup',
	// Click events
	'click',
	'contextmenu',
	'dblclick',
	'drag',
	'dragend',
	'dragenter',
	'dragexit',
	'dragleave',
	'dragover',
	'dragstart',
	'drop',
	'mousedown',
	'mouseenter',
	'mouseleave',
	'mousemove',
	'mouseout',
	'mouseover',
	'mouseup',
];
const a11y_recommended_interactive_handlers = [
	'click',
	'mousedown',
	'mouseup',
	'keypress',
	'keydown',
	'keyup',
];
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
