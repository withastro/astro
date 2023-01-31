import './server-shim.js';
import '@lit-labs/ssr/lib/render-lit-html.js';
import { LitElementRenderer } from '@lit-labs/ssr/lib/lit-element-renderer.js';
import * as parse5 from 'parse5';

function isCustomElementTag(name) {
	return typeof name === 'string' && /-/.test(name);
}

function getCustomElementConstructor(name) {
	if (typeof customElements !== 'undefined' && isCustomElementTag(name)) {
		return customElements.get(name) || null;
	} else if (typeof name === 'function') {
		return name;
	}
	return null;
}

async function isLitElement(Component) {
	const Ctr = getCustomElementConstructor(Component);
	return !!(Ctr && Ctr._$litElement$);
}

async function check(Component, _props, _children) {
	// Lit doesn't support getting a tagName from a Constructor at this time.
	// So this must be a string at the moment.
	return !!(await isLitElement(Component));
}

function* render(Component, attrs, slots) {
	let tagName = Component;
	if (typeof tagName !== 'string') {
		tagName = Component[Symbol.for('tagName')];
	}
	const instance = new LitElementRenderer(tagName);

	if (attrs) {
    for (let [name, value] of Object.entries(attrs)) {
      // Stringify every JSX bound object. This means that one cannot pass a
      // non-stringifiable object as a bound JSX prop, e.g. an HTMLElement ref.
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }

      if (typeof value === 'boolean') {
        // Booleans are calculated with hasAttibute, so don't setAttribute if
        // false. If user wants `attr="false"` then they must use a string.
        if (!value) {
          continue;
        }

        value = '';
      }

      // Set the attribute no matter if it's a reactive property or not this
      // helps make sure that all SSRd values are serialized to the DOM. If a
      // property cannot react to attribute changes, then it's not suitable for
      // SSG that Astro provides.
      instance.setAttribute(name, value);
    }
  }

	instance.connectedCallback();

	yield `<${tagName}`;
	yield* instance.renderAttributes();
	yield `>`;
	const shadowContents = instance.renderShadow({});
	if (shadowContents !== undefined) {
		yield '<template shadowroot="open">';
		yield* shadowContents;
		yield '</template>';
	}
	if (slots) {
		for (let [slot, value = ''] of Object.entries(slots)) {
			if (slot !== 'default' && value) {
				// Parse the value as a concatenated string
				const fragment = parse5.parseFragment(`${value}`);

				// Add the missing slot attribute to child Element nodes
				for (const node of fragment.childNodes) {
					if (node.tagName && !node.attrs.some(({ name }) => name === 'slot')) {
						node.attrs.push({ name: 'slot', value: slot });
					}
				}

				value = parse5.serialize(fragment);
			}

			yield value;
		}
	}
	yield `</${tagName}>`;
}

async function renderToStaticMarkup(Component, props, slots) {
	let tagName = Component;

	let out = '';
	for (let chunk of render(tagName, props, slots)) {
		out += chunk;
	}

	return {
		html: out,
	};
}

export default {
	check,
	renderToStaticMarkup,
};
