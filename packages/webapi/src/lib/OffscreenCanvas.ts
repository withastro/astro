import type { CanvasRenderingContext2D } from './CanvasRenderingContext2D'

import { __createCanvasRenderingContext2D } from './CanvasRenderingContext2D'
import * as _ from './utils'

export class OffscreenCanvas extends EventTarget {
	constructor(width: number, height: number) {
		super()

		if (arguments.length < 2)
			throw new TypeError(
				`Failed to construct 'OffscreenCanvas': 2 arguments required.`
			)

		width = Number(width) || 0
		height = Number(height) || 0

		_.INTERNALS.set(this, { width, height } as OffscreenCanvasInternals)
	}

	get height(): number {
		return _.internalsOf(this, 'OffscreenCanvas', 'height').height
	}

	set height(value) {
		_.internalsOf(this, 'OffscreenCanvas', 'height').height = Number(value) || 0
	}

	get width(): number {
		return _.internalsOf(this, 'OffscreenCanvas', 'width').width
	}

	set width(value) {
		_.internalsOf(this, 'OffscreenCanvas', 'width').width = Number(value) || 0
	}

	getContext(
		contextType: PredefinedContextId
	): CanvasRenderingContext2D | null {
		const internals = _.internalsOf<OffscreenCanvasInternals>(
			this,
			'HTMLCanvasElement',
			'getContext'
		)

		switch (contextType) {
			case '2d':
				if (internals.renderingContext2D) return internals.renderingContext2D

				internals.renderingContext2D = __createCanvasRenderingContext2D(this)

				return internals.renderingContext2D
			default:
				return null
		}
	}

	convertToBlob(options: Partial<ConvertToBlobOptions>) {
		options = Object(options)

		const quality = Number(options.quality) || 0
		const type = getImageType(String(options.type).trim().toLowerCase())

		void quality

		return Promise.resolve(new Blob([], { type }))
	}
}

_.allowStringTag(OffscreenCanvas)

const getImageType = (type: string): PredefinedImageType =>
	type === 'image/avif' ||
	type === 'image/jpeg' ||
	type === 'image/png' ||
	type === 'image/webp'
		? type
		: 'image/png'

interface OffscreenCanvasInternals {
	height: number
	renderingContext2D: CanvasRenderingContext2D
	width: number
}

interface ConvertToBlobOptions {
	quality: number
	type: PredefinedImageType
}

type PredefinedContextId =
	| '2d'
	| 'bitmaprenderer'
	| 'webgl'
	| 'webgl2'
	| 'webgpu'

type PredefinedImageType =
	| 'image/avif'
	| 'image/jpeg'
	| 'image/png'
	| 'image/webp'
