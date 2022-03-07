import * as _ from './utils'

export class MediaQueryList extends EventTarget {
	get matches(): boolean {
		return _.internalsOf(this, 'MediaQueryList', 'matches').matches
	}

	get media(): string {
		return _.internalsOf(this, 'MediaQueryList', 'media').media
	}
}

_.allowStringTag(MediaQueryList)

export const initMediaQueryList = (target: Target, exclude: Set<string>) => {
	if (exclude.has('MediaQueryList') || exclude.has('matchMedia')) return

	const EventTarget = target.EventTarget || globalThis.EventTarget
	const MediaQueryList = target.MediaQueryList || globalThis.MediaQueryList

	target.matchMedia = function matchMedia(media: string) {
		const mql = Object.setPrototypeOf(new EventTarget(), MediaQueryList.prototype) as MediaQueryList

		_.INTERNALS.set(mql, {
			matches: false,
			media,
		})

		return mql
	}
}

interface Target extends Record<any, any> {
	matchMedia: {
		(media: string): MediaQueryList
	}
}
