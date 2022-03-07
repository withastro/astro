import * as _ from './utils'

export class TreeWalker {
	parentNode(): Node | null {
		return null
	}

	firstChild(): Node | null {
		return null
	}

	lastChild(): Node | null {
		return null
	}

	previousSibling(): Node | null {
		return null
	}

	nextSibling(): Node | null {
		return null
	}

	previousNode(): Node | null {
		return null
	}

	nextNode(): Node | null {
		return null
	}

	get currentNode(): Node {
		const internals = _.internalsOf<TreeWalkerInternals>(
			this,
			'TreeWalker',
			'currentNode'
		)
		return internals.currentNode
	}

	get root(): Node {
		const internals = _.internalsOf<TreeWalkerInternals>(
			this,
			'TreeWalker',
			'root'
		)
		return internals.root
	}

	get whatToShow(): number {
		const internals = _.internalsOf<TreeWalkerInternals>(
			this,
			'TreeWalker',
			'whatToShow'
		)
		return internals.whatToShow
	}
}

_.allowStringTag(TreeWalker)

export interface TreeWalkerInternals {
	filter: NodeFilter
	currentNode: Node
	root: Node
	whatToShow: number
}
