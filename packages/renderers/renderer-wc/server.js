import { HTMLElement, getNameByTypeOfElement } from './server-dom.js'

async function check(Component, _props, _children) {
	return HTMLElement.isPrototypeOf(Component)
}

async function renderToStaticMarkup(Component, props, children, metadata, assets) {
	// disable the default client hydration script
	assets.useHydrationScript = false

	/** Custom Element tag name, if defined from `customElements`. */
	const definedName = getNameByTypeOfElement(Component)

	/** Custom Element tag name, falling back on the display name. */
	const assuredName = definedName || toHyphenName(metadata.displayName)

	const { attrs, slots } = toAttrsAndSlots(props, Component.observedAttributes)

	// hydrate the custom element with its component js
	if (metadata.componentUrl) {
		assets.scripts.add({
			props: { type: 'module' },
			children: `import('${metadata.componentUrl}')${
				// if necessary, automatically define the custom element using the generated name
				definedName
					? ``
				: `.then(exports=>customElements.define('${assuredName}',exports['${metadata.componentExport}']))`
			}`,
		})
	}

	return {
		html: `<${assuredName}${attrs}>${slots}${children}</${assuredName}>`,
	}
}

/** Returns a component name as an HTML tag. */
const toHyphenName = name => name.replace(/^HTMLElement$/, 'hElement').replace(/[A-Z]/g, '-$&').toLowerCase().replace(/^-/, 'html-')

/** Returns separated attributes and slots from the given props, based upon the given observed attributes. */
const toAttrsAndSlots = (props, preservedAttributes) => {
	preservedAttributes = preservedAttributes || []
	preservedAttributes = new Set([ ...globalAttributes, ...preservedAttributes ])

	let attrs = ''
	let slots = ''

	for (let name in props) {
		if (
			preservedAttributes.has(name) ||
			/^aria-./.test(name) ||
			/^data-./.test(name) ||
			/^on./.test(name)
		) {
			attrs += ` ${name}="${props[name]}"`
		}

		if (preservedAttributes.has(name)) {
			attrs += ` ${name}="${props[name]}"`
		} else {
			slots += `<data slot="${name}">${props[name]}</data> `
		}
	}

	return { attrs, slots }
}

/** Global attributes common to all HTML elements. */
const globalAttributes = [
	'accesskey',
	'autocapitalize',
	'autofocus',
	'class',
	'contenteditable',
	'dir',
	'draggable',
	'enterkeyhint',
	'exportparts',
	'hidden',
	'id',
	'is',
	'itemid',
	'itemprop',
	'itemref',
	'itemscope',
	'itemtype',
	'lang',
	'nonce',
	'part',
	'slot',
	'spellcheck',
	'style',
	'tabindex',
	'title',
	'translate'
]

export default { check, renderToStaticMarkup }
