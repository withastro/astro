import { preprocessors, codecs as supportedFormats } from './codecs.js'
import ImageData from './image_data.js'

type EncoderKey = keyof typeof supportedFormats

const DELAY_MS = 1000
let _promise: Promise<void> | undefined

function delayOnce(ms: number): Promise<void> {
  if (!_promise) {
    _promise = new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }
  return _promise
}

function maybeDelay(): Promise<void> {
  const isAppleM1 = process.arch === 'arm64' && process.platform === 'darwin'
  if (isAppleM1) {
    return delayOnce(DELAY_MS)
  }
  return Promise.resolve()
}

export async function decodeBuffer(
  _buffer: Buffer | Uint8Array
): Promise<ImageData> {
  const buffer = Buffer.from(_buffer)
  const firstChunk = buffer.slice(0, 16)
  const firstChunkString = Array.from(firstChunk)
    .map((v) => String.fromCodePoint(v))
    .join('')
	// TODO (future PR): support more formats
	if (firstChunkString.includes('GIF')) {
		throw Error(`GIF images are not supported, please use the Sharp image service`)
	}
  const key = Object.entries(supportedFormats).find(([, { detectors }]) =>
    detectors.some((detector) => detector.exec(firstChunkString))
  )?.[0] as EncoderKey | undefined
  if (!key) {
    throw Error(`Buffer has an unsupported format`)
  }
  const encoder = supportedFormats[key]
  const mod = await encoder.dec()
  const rgba = mod.decode(new Uint8Array(buffer))
	// @ts-ignore
  return rgba
}

export async function rotate(
  image: ImageData,
  numRotations: number
): Promise<ImageData> {
  image = ImageData.from(image)

  const m = await preprocessors['rotate'].instantiate()
  return await m(image.data, image.width, image.height, { numRotations })
}

type ResizeOpts = { image: ImageData } & { width?: number; height?: number }

export async function resize({ image, width, height }: ResizeOpts) {
  image = ImageData.from(image)

  const p = preprocessors['resize']
  const m = await p.instantiate()
  await maybeDelay()
  return await m(image.data, image.width, image.height, {
    ...p.defaultOptions,
    width,
    height,
  })
}

export async function encodeJpeg(
  image: ImageData,
  opts: { quality?: number }
): Promise<Uint8Array> {
  image = ImageData.from(image)

  const e = supportedFormats['mozjpeg']
  const m = await e.enc()
  await maybeDelay()
	const quality = opts.quality || e.defaultEncoderOptions.quality
  const r = await m.encode(image.data, image.width, image.height, {
    ...e.defaultEncoderOptions,
    quality,
  })
  return r
}

export async function encodeWebp(
  image: ImageData,
  opts: { quality?: number }
): Promise<Uint8Array> {
  image = ImageData.from(image)

  const e = supportedFormats['webp']
  const m = await e.enc()
  await maybeDelay()
	const quality = opts.quality || e.defaultEncoderOptions.quality
  const r = await m.encode(image.data, image.width, image.height, {
    ...e.defaultEncoderOptions,
    quality,
  })
  return r
}

export async function encodeAvif(
  image: ImageData,
  opts: { quality?: number }
): Promise<Uint8Array> {
  image = ImageData.from(image)

  const e = supportedFormats['avif']
  const m = await e.enc()
  await maybeDelay()
  const val = e.autoOptimize.min
	// AVIF doesn't use a 0-100 quality, default to 75 and convert to cqLevel below
	const quality = opts.quality || 75
  const r = await m.encode(image.data, image.width, image.height, {
    ...e.defaultEncoderOptions,
    // Think of cqLevel as the "amount" of quantization (0 to 62),
    // so a lower value yields higher quality (0 to 100).
    cqLevel: quality === 0 ? val : Math.round(val - (quality / 100) * val),
  })
  return r
}

export async function encodePng(
  image: ImageData
): Promise<Uint8Array> {
  image = ImageData.from(image)

  const e = supportedFormats['oxipng']
  const m = await e.enc()
  await maybeDelay()
  const r = await m.encode(image.data, image.width, image.height, {
    ...e.defaultEncoderOptions,
  })
  return r
}
