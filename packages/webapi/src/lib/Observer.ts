import * as _ from './utils'

export class IntersectionObserver {
	disconnect() {}

	observe() {}

	takeRecords() {
		return []
	}

	unobserve() {}
}

export class MutationObserver {
	disconnect() {}

	observe() {}

	takeRecords() {
		return []
	}

	unobserve() {}
}

export class ResizeObserver {
	disconnect() {}

	observe() {}

	takeRecords() {
		return []
	}

	unobserve() {}
}

_.allowStringTag(MutationObserver)
_.allowStringTag(IntersectionObserver)
_.allowStringTag(ResizeObserver)
