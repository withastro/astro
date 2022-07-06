import { HTMLElement } from './Element'
import * as _ from './utils'

export class HTMLImageElement extends HTMLElement {
	get src(): string {
		return _.internalsOf(this, 'HTMLImageElement', 'src').src
	}

	set src(value) {
		const internals = _.internalsOf(this, 'HTMLImageElement', 'src')

		internals.src = String(value)
	}
}

_.allowStringTag(HTMLImageElement)
