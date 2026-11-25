import { version } from 'react';

// HTML boolean attributes whose React prop has the same name and which React treats as booleans,
// so the empty string of an attribute written without a value would be read as `false`.
// `async` is left out: React 19 hoists `<script async src>` to the start of the island.
// See: https://github.com/withastro/astro/issues/18812
const BOOLEAN_ATTRIBUTES = new Set([
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
	'selected',
]);

// React 18 renders `inert` as a plain attribute and drops `true`, React 19 treats it as a boolean.
if (Number.parseInt(version) >= 19) {
	BOOLEAN_ATTRIBUTES.add('inert');
}

// Input types whose `value` the user cannot edit. React does not write `defaultValue` for some of
// them (such as submit and reset) when mounting on the client, so `value` is kept as is.
const READ_ONLY_VALUE_INPUT_TYPES = new Set([
	'button',
	'checkbox',
	'hidden',
	'image',
	'radio',
	'reset',
	'submit',
]);

/**
 * Converts the HTML attributes of an element into React props: present boolean attributes become
 * `true`, and `value` and `checked` on an editable `<input>` become `defaultValue` and
 * `defaultChecked`, so the field is not controlled by React.
 */
export function htmlAttributesToProps(
	tagName: string,
	attributes: Record<string, string>,
): Record<string, string | boolean> {
	const props: Record<string, string | boolean> = {};
	const isInput = tagName.toLowerCase() === 'input';
	const hasReadOnlyValue =
		isInput && READ_ONLY_VALUE_INPUT_TYPES.has(attributes.type?.toLowerCase() ?? '');
	for (const [name, value] of Object.entries(attributes)) {
		if (isInput && name === 'checked') {
			props.defaultChecked = true;
		} else if (isInput && name === 'value' && !hasReadOnlyValue) {
			props.defaultValue = value;
		} else if (BOOLEAN_ATTRIBUTES.has(name)) {
			props[name] = true;
		} else {
			props[name] = value;
		}
	}
	return props;
}
