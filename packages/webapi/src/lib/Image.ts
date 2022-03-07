import * as _ from './utils'
import { HTMLImageElement } from './HTMLImageElement'

export function Image() {
	// @ts-ignore
	_.INTERNALS.set(this, {
		attributes: {},
		localName: 'img',
		innerHTML: '',
		shadowRoot: null,
		shadowInit: null,
	})
}

Image.prototype = HTMLImageElement.prototype
