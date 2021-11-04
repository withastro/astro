# Astro Web Components Renderer

This is a plugin for [Astro](https://astro.build/) apps that enables usage of [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components).

## Installation

Install `@astrojs/renderer-wc` and then add it to your `astro.config.js` in the `renderers` property:

```bash
npm install @astrojs/renderer-wc
```

__astro.config.mjs__

```js
export default {
	renderers: [
		'@astrojs/renderer-wc'
	]
}
```

## Usage

If you're familiar with Astro then you already know that you can import components into your templates and use them. What's different about custom elements is you can use the *tag name* directly.

Astro needs to know which tag is associated with which component script. We expose this through exporting a `tagName` variable from the component script. It looks like this:

__src/components/heading.js__

```js
export class Heading extends HTMLElement {
	constructor() {
		super()
		this.disconnectedCallback()
	}

	connectedCallback() {
		let closest = this, level = 1

		while (closest = /** @type {this} */ (closest.parentNode)) {
			if (sectionElements.has(closest.tagName)) {
				++level
			}
		}

		this.setAttribute('aria-level', String(level))
	}

	disconnectedCallback() {
		this.setAttribute('role', 'heading')
		this.setAttribute('aria-level', '1')
	}
}

const sectionElements = new Set(['ARTICLE', 'ASIDE', 'NAV', 'SECTION'])

customElements.define('html-h', Heading)
```

__src/pages/index.astro__

```astro
---
import { Heading } from '../components/heading.js';
---

<my-element></my-element>
```

## More Documentation

[Astro Renderer Documentation](https://docs.astro.build/reference/renderer-reference)
