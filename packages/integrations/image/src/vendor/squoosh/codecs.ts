import { promises as fsp } from 'node:fs'
import { getModuleURL, instantiateEmscriptenWasm, pathify } from './emscripten-utils.js'

interface DecodeModule extends EmscriptenWasm.Module {
  decode: (data: Uint8Array) => ImageData
}

type DecodeModuleFactory = EmscriptenWasm.ModuleFactory<DecodeModule>

interface RotateModuleInstance {
  exports: {
    memory: WebAssembly.Memory
    rotate(width: number, height: number, rotate: number): void
  }
}

interface ResizeWithAspectParams {
  input_width: number
  input_height: number
  target_width?: number
  target_height?: number
}

export interface ResizeOptions {
  width?: number
  height?: number
  method: 'triangle' | 'catrom' | 'mitchell' | 'lanczos3'
  premultiply: boolean
  linearRGB: boolean
}

export interface RotateOptions {
  numRotations: number
}

// MozJPEG
import type { MozJPEGModule as MozJPEGEncodeModule } from './mozjpeg/mozjpeg_enc'
import mozDec from './mozjpeg/mozjpeg_node_dec.js'
import mozEnc from './mozjpeg/mozjpeg_node_enc.js'
const mozEncWasm = new URL('./mozjpeg/mozjpeg_node_enc.wasm', getModuleURL(import.meta.url))
const mozDecWasm = new URL('./mozjpeg/mozjpeg_node_dec.wasm', getModuleURL(import.meta.url))

// WebP
import type { WebPModule as WebPEncodeModule } from './webp/webp_enc'
import webpDec from './webp/webp_node_dec.js'
import webpEnc from './webp/webp_node_enc.js'
const webpEncWasm = new URL('./webp/webp_node_enc.wasm', getModuleURL(import.meta.url))
const webpDecWasm = new URL('./webp/webp_node_dec.wasm', getModuleURL(import.meta.url))

// AVIF
import type { AVIFModule as AVIFEncodeModule } from './avif/avif_enc'
import avifDec from './avif/avif_node_dec.js'
import avifEnc from './avif/avif_node_enc.js'
const avifEncWasm = new URL('./avif/avif_node_enc.wasm', getModuleURL(import.meta.url))
const avifDecWasm = new URL('./avif/avif_node_dec.wasm', getModuleURL(import.meta.url))

// PNG
import * as pngEncDec from './png/squoosh_png.js'
const pngEncDecWasm = new URL('./png/squoosh_png_bg.wasm', getModuleURL(import.meta.url))
const pngEncDecInit = () =>
  pngEncDec.default(fsp.readFile(pathify(pngEncDecWasm.toString())))

// OxiPNG
import * as oxipng from './png/squoosh_oxipng.js'
const oxipngWasm = new URL('./png/squoosh_oxipng_bg.wasm', getModuleURL(import.meta.url))
const oxipngInit = () => oxipng.default(fsp.readFile(pathify(oxipngWasm.toString())))

// Resize
import * as resize from './resize/squoosh_resize.js'
const resizeWasm = new URL('./resize/squoosh_resize_bg.wasm', getModuleURL(import.meta.url))
const resizeInit = () => resize.default(fsp.readFile(pathify(resizeWasm.toString())))

// rotate
const rotateWasm = new URL('./rotate/rotate.wasm', getModuleURL(import.meta.url))

// Our decoders currently rely on a `ImageData` global.
import ImageData from './image_data.js'
(global as any).ImageData = ImageData

function resizeNameToIndex(
  name: 'triangle' | 'catrom' | 'mitchell' | 'lanczos3'
) {
  switch (name) {
    case 'triangle':
      return 0
    case 'catrom':
      return 1
    case 'mitchell':
      return 2
    case 'lanczos3':
      return 3
    default:
      throw Error(`Unknown resize algorithm "${name}"`)
  }
}

function resizeWithAspect({
  input_width,
  input_height,
  target_width,
  target_height,
}: ResizeWithAspectParams): { width: number; height: number } {
  if (!target_width && !target_height) {
    throw Error('Need to specify at least width or height when resizing')
  }

  if (target_width && target_height) {
    return { width: target_width, height: target_height }
  }

  if (!target_width) {
    return {
      width: Math.round((input_width / input_height) * target_height!),
      height: target_height!,
    }
  }

  return {
    width: target_width,
    height: Math.round((input_height / input_width) * target_width),
  }
}

export const preprocessors = {
  resize: {
    name: 'Resize',
    description: 'Resize the image before compressing',
    instantiate: async () => {
      await resizeInit()
      return (
        buffer: Uint8Array,
        input_width: number,
        input_height: number,
        { width, height, method, premultiply, linearRGB }: ResizeOptions
      ) => {
        ;({ width, height } = resizeWithAspect({
          input_width,
          input_height,
          target_width: width,
          target_height: height,
        }))
        const imageData = new ImageData(
          resize.resize(
            buffer,
            input_width,
            input_height,
            width,
            height,
            resizeNameToIndex(method),
            premultiply,
            linearRGB
          ),
          width,
          height
        )
				resize.cleanup()
        return imageData
      }
    },
    defaultOptions: {
      method: 'lanczos3',
      fitMethod: 'stretch',
      premultiply: true,
      linearRGB: true,
    },
  },
  rotate: {
    name: 'Rotate',
    description: 'Rotate image',
    instantiate: async () => {
      return async (
        buffer: Uint8Array,
        width: number,
        height: number,
        { numRotations }: RotateOptions
      ) => {
        const degrees = (numRotations * 90) % 360
        const sameDimensions = degrees === 0 || degrees === 180
        const size = width * height * 4
        const instance = (
          await WebAssembly.instantiate(await fsp.readFile(pathify(rotateWasm.toString())))
        ).instance as RotateModuleInstance
        const { memory } = instance.exports
        const additionalPagesNeeded = Math.ceil(
          (size * 2 - memory.buffer.byteLength + 8) / (64 * 1024)
        )
        if (additionalPagesNeeded > 0) {
          memory.grow(additionalPagesNeeded)
        }
        const view = new Uint8ClampedArray(memory.buffer)
        view.set(buffer, 8)
        instance.exports.rotate(width, height, degrees)
        return new ImageData(
          view.slice(size + 8, size * 2 + 8),
          sameDimensions ? width : height,
          sameDimensions ? height : width
        )
      }
    },
    defaultOptions: {
      numRotations: 0,
    },
  },
} as const

export const codecs = {
  mozjpeg: {
    name: 'MozJPEG',
    extension: 'jpg',
    detectors: [/^\xFF\xD8\xFF/],
    dec: () =>
      instantiateEmscriptenWasm(mozDec as DecodeModuleFactory, mozDecWasm.toString()),
    enc: () =>
      instantiateEmscriptenWasm(
        mozEnc as EmscriptenWasm.ModuleFactory<MozJPEGEncodeModule>,
        mozEncWasm.toString()
      ),
    defaultEncoderOptions: {
      quality: 75,
      baseline: false,
      arithmetic: false,
      progressive: true,
      optimize_coding: true,
      smoothing: 0,
      color_space: 3 /*YCbCr*/,
      quant_table: 3,
      trellis_multipass: false,
      trellis_opt_zero: false,
      trellis_opt_table: false,
      trellis_loops: 1,
      auto_subsample: true,
      chroma_subsample: 2,
      separate_chroma_quality: false,
      chroma_quality: 75,
    },
    autoOptimize: {
      option: 'quality',
      min: 0,
      max: 100,
    },
  },
  webp: {
    name: 'WebP',
    extension: 'webp',
    detectors: [/^RIFF....WEBPVP8[LX ]/s],
    dec: () =>
      instantiateEmscriptenWasm(webpDec as DecodeModuleFactory, webpDecWasm.toString()),
    enc: () =>
      instantiateEmscriptenWasm(
        webpEnc as EmscriptenWasm.ModuleFactory<WebPEncodeModule>,
        webpEncWasm.toString()
      ),
    defaultEncoderOptions: {
      quality: 75,
      target_size: 0,
      target_PSNR: 0,
      method: 4,
      sns_strength: 50,
      filter_strength: 60,
      filter_sharpness: 0,
      filter_type: 1,
      partitions: 0,
      segments: 4,
      pass: 1,
      show_compressed: 0,
      preprocessing: 0,
      autofilter: 0,
      partition_limit: 0,
      alpha_compression: 1,
      alpha_filtering: 1,
      alpha_quality: 100,
      lossless: 0,
      exact: 0,
      image_hint: 0,
      emulate_jpeg_size: 0,
      thread_level: 0,
      low_memory: 0,
      near_lossless: 100,
      use_delta_palette: 0,
      use_sharp_yuv: 0,
    },
    autoOptimize: {
      option: 'quality',
      min: 0,
      max: 100,
    },
  },
  avif: {
    name: 'AVIF',
    extension: 'avif',
    // eslint-disable-next-line no-control-regex
    detectors: [/^\x00\x00\x00 ftypavif\x00\x00\x00\x00/],
    dec: () =>
      instantiateEmscriptenWasm(avifDec as DecodeModuleFactory, avifDecWasm.toString()),
    enc: async () => {
      return instantiateEmscriptenWasm(
        avifEnc as EmscriptenWasm.ModuleFactory<AVIFEncodeModule>,
        avifEncWasm.toString()
      )
    },
    defaultEncoderOptions: {
      cqLevel: 33,
      cqAlphaLevel: -1,
      denoiseLevel: 0,
      tileColsLog2: 0,
      tileRowsLog2: 0,
      speed: 6,
      subsample: 1,
      chromaDeltaQ: false,
      sharpness: 0,
      tune: 0 /* AVIFTune.auto */,
    },
    autoOptimize: {
      option: 'cqLevel',
      min: 62,
      max: 0,
    },
  },
  oxipng: {
    name: 'OxiPNG',
    extension: 'png',
    // eslint-disable-next-line no-control-regex
    detectors: [/^\x89PNG\x0D\x0A\x1A\x0A/],
    dec: async () => {
      await pngEncDecInit()
      return {
        decode: (buffer: Buffer | Uint8Array) => {
          const imageData = pngEncDec.decode(buffer)
					pngEncDec.cleanup()
          return imageData
        },
      }
    },
    enc: async () => {
      await pngEncDecInit()
      await oxipngInit()
      return {
        encode: (
          buffer: Uint8ClampedArray | ArrayBuffer,
          width: number,
          height: number,
          opts: { level: number }
        ) => {
          const simplePng = pngEncDec.encode(
            new Uint8Array(buffer),
            width,
            height
          )
          const imageData = oxipng.optimise(simplePng, opts.level, false)
					oxipng.cleanup()
          return imageData
        },
      }
    },
    defaultEncoderOptions: {
      level: 2,
    },
    autoOptimize: {
      option: 'level',
      min: 6,
      max: 1,
    },
  },
} as const
