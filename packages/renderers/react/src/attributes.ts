const PROP_NAMES = new Map([
	['class', 'className'],
	['for', 'htmlFor'],
]);

// React drops a boolean prop whose value is falsy, and an attribute written without a value, such
// as `<details open>`, arrives as an empty string. These are the boolean props React 18 and 19 both
// spell like the HTML attribute, apart from `async`, which makes React 19 hoist a script.
// See: https://github.com/withastro/astro/issues/18812
const BOOLEAN_PROPS = new Set([
	'checked',
	'controls',
	'default',
	'defer',
	'disabled',
	'hidden',
	'loop',
	'multiple',
	'muted',
	'open',
	'required',
	'reversed',
	'scoped',
	'seamless',
	'selected',
]);

// React controls an input that has a `checked` prop, or a `value` prop on any type but these, and a
// controlled input without `onChange` ignores typing and clicks after hydration. The attributes only
// give the field its starting state, which is what `defaultChecked` and `defaultValue` do.
const INPUT_TYPES_WITH_UNCONTROLLED_VALUE = new Set([
	'button',
	'checkbox',
	'hidden',
	'image',
	'radio',
	'reset',
	'submit',
]);

/**
 * Returns the React props for an element's attributes in `experimentalReactChildren` children.
 *
 * Names are matched as written, as React matches them. A custom element, or a built-in element
 * with an `is` attribute, keeps its attributes as written apart from `class`.
 */
export function toReactProps(
	elementName: string,
	attributes: Iterable<[name: string, value: string]>,
): Record<string, string | boolean> {
	const attributeMap = new Map(attributes);
	const isCustomElement = elementName.includes('-') || attributeMap.has('is');
	const isInput = elementName === 'input';
	const inputType = attributeMap.get('type') ?? 'text';

	const props: Record<string, string | boolean> = {};
	for (const [name, value] of attributeMap) {
		if (isCustomElement) {
			props[name === 'class' ? 'className' : name] = value;
		} else if (BOOLEAN_PROPS.has(name)) {
			props[isInput && name === 'checked' ? 'defaultChecked' : name] = value === '' ? true : value;
		} else if (isInput && name === 'value' && !INPUT_TYPES_WITH_UNCONTROLLED_VALUE.has(inputType)) {
			props.defaultValue = value;
		} else {
			props[PROP_NAMES.get(name) ?? name] = value;
		}
	}
	return props;
}
