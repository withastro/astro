import { HTMLElement, getNameByCustomElement } from './server-dom.js'

async function check(Component, _props, _children) {
	return HTMLElement.isPrototypeOf(Component)
}

async function renderToStaticMarkup(Component, props, children, metadata, assets) {
	assets.useHydrationScript = false

	const definedName = getNameByCustomElement(Component)
	const assuredName = definedName || toHyphenName(Component.name)

	const { attrs, slots } = toAttrsAndSlots(props, Component.observedAttributes)

	if (metadata.componentUrl) {
		assets.scripts.add({
			props: { type: 'module' },
			children: `import('${metadata.componentUrl}')${
				definedName
					? ``
				: `.then(exports=>customElements.define('${assuredName}',exports['${metadata.componentExport}']))`
			}`,
		})

		assets.styles.add({
			props: { type: 'module' },
			children: `import('${metadata.componentUrl}')${
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
const toHyphenName = name => name.replace(/[A-Z]/g, '-$&').toLowerCase().replace(/^-/, 'html-')

/** Returns separated attributes and slots from the given props, based upon the given observed attributes. */
const toAttrsAndSlots = (props, observedAttributes) => {
	observedAttributes = new Set(observedAttributes || [])

	let attrs = ''
	let slots = ''

	for (let name in props) {
		if (name === 'client:script') continue

		if (observedAttributes.has(name)) {
			attrs += ` ${name}="${props[name]}"`
		} else {
			slots += `<data slot="${name}">${props[name]}</data> `
		}
	}

	return { attrs, slots }
}

export default { check, renderToStaticMarkup }
