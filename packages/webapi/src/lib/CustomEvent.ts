import * as _ from './utils'
import { Event } from 'event-target-shim'

class CustomEvent<
	TEventType extends string = string
> extends Event<TEventType> {
	constructor(type: TEventType, params?: CustomEventInit) {
		params = Object(params) as Required<CustomEventInit>

		super(type, params)

		if ('detail' in params) this.detail = params.detail
	}

	detail!: any
}

_.allowStringTag(CustomEvent)

export { CustomEvent }

interface CustomEventInit {
	bubbles?: boolean
	cancelable?: false
	detail?: any
}
