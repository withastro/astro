import * as _ from './utils'

export class ImageData {
	constructor(width: number, height: number)
	constructor(width: number, height: number, settings: ImageDataSettings)
	constructor(data: Uint8ClampedArray, width: number)
	constructor(data: Uint8ClampedArray, width: number, height: number)
	constructor(
		data: Uint8ClampedArray,
		width: number,
		height: number,
		settings: ImageDataSettings
	)

	constructor(
		arg0: number | Uint8ClampedArray,
		arg1: number,
		...args: [] | [number] | [ImageDataSettings] | [number, ImageDataSettings]
	) {
		if (arguments.length < 2)
			throw new TypeError(
				`Failed to construct 'ImageData': 2 arguments required.`
			)

		/** Whether Uint8ClampedArray data is provided. */
		const hasData = _.__object_isPrototypeOf(Uint8ClampedArray.prototype, arg0)

		/** Image data, either provided or calculated. */
		const d = hasData
			? (arg0 as Uint8ClampedArray)
			: new Uint8ClampedArray(
					asNumber(arg0, 'width') * asNumber(arg1, 'height') * 4
			  )

		/** Image width. */
		const w = asNumber(hasData ? arg1 : arg0, 'width')

		/** Image height. */
		const h = d.length / w / 4

		/** Image color space. */
		const c = String(
			Object(hasData ? args[1] : args[0]).colorSpace || 'srgb'
		) as PredefinedColorSpace

		// throw if a provided height does not match the calculated height
		if (args.length && asNumber(args[0], 'height') !== h)
			throw new DOMException(
				'height is not equal to (4 * width * height)',
				'IndexSizeError'
			)

		// throw if a provided colorspace does not match a known colorspace
		if (c !== 'srgb' && c !== 'rec2020' && c !== 'display-p3')
			throw new TypeError('colorSpace is not known value')

		Object.defineProperty(this, 'data', {
			configurable: true,
			enumerable: true,
			value: d,
		})

		_.INTERNALS.set(this, {
			width: w,
			height: h,
			colorSpace: c,
		} as ImageDataInternals)
	}

	get data(): Uint8ClampedArray {
		_.internalsOf<ImageDataInternals>(this, 'ImageData', 'data')

		return (
			Object.getOwnPropertyDescriptor(this, 'data') as {
				value: Uint8ClampedArray
			}
		).value
	}

	get width(): ImageDataInternals['width'] {
		return _.internalsOf<ImageDataInternals>(this, 'ImageData', 'width').width
	}

	get height(): ImageDataInternals['height'] {
		return _.internalsOf<ImageDataInternals>(this, 'ImageData', 'height').height
	}
}

_.allowStringTag(ImageData)

/** Returns a coerced number, optionally throwing if the number is zero-ish. */
const asNumber = (value: any, axis: string): number => {
	value = Number(value) || 0

	if (value === 0)
		throw new TypeError(`The source ${axis} is zero or not a number.`)

	return value
}

interface ImageDataInternals {
	colorSpace: PredefinedColorSpace
	height: number
	width: number
}

interface ImageDataSettings {
	colorSpace?: PredefinedColorSpace
}

type PredefinedColorSpace = 'srgb' | 'rec2020' | 'display-p3'
