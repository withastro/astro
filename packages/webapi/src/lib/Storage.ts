import * as _ from './utils'

export class Storage {
	clear(): void {
		_.internalsOf<StorageInternals>(this, 'Storage', 'clear').storage.clear()
	}

	getItem(key: string): string | null {
		return getStringOrNull(
			_.internalsOf<StorageInternals>(this, 'Storage', 'getItem').storage.get(String(key))
		)
	}

	key(index: number): string | null {
		return getStringOrNull([ ..._.internalsOf<StorageInternals>(this, 'Storage', 'key').storage.keys() ][Number(index) || 0])
	}

	removeItem(key: string): void {
		_.internalsOf<StorageInternals>(this, 'Storage', 'getItem').storage.delete(String(key))
	}

	setItem(key: string, value: any): void {
		_.internalsOf<StorageInternals>(this, 'Storage', 'getItem').storage.set(String(key), String(value))
	}

	get length() {
		return _.internalsOf<StorageInternals>(this, 'Storage', 'size').storage.size
	}
}

const getStringOrNull = (value: string | void) => typeof value === 'string' ? value : null

export const initStorage = (target: Target, exclude: Set<string>) => {
	if (exclude.has('Storage') || exclude.has('localStorage')) return

	target.localStorage = Object.create(Storage.prototype)

	const storageInternals = new Map<string, string>()

	_.INTERNALS.set(target.localStorage, {
		storage: storageInternals
	} as StorageInternals)
}

interface StorageInternals {
	storage: Map<string, string>
}

interface Target {
	localStorage: Storage
}
