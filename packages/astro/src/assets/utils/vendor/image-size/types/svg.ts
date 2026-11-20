import type { IImage, ISize } from './interface.ts'
import { toUTF8String } from './utils.js'

interface IAttributes {
  width: number | null
  height: number | null
  viewbox?: IAttributes | null
}

const svgReg = /<svg\s([^>"']|"[^"]*"|'[^']*')*>/
const svgStartReg = /^<svg\s/

const extractorRegExps = {
  height: /\sheight=(['"])([^%]+?)\1/,
  root: svgReg,
  viewbox: /\sviewBox=(['"])(.+?)\1/i,
  width: /\swidth=(['"])([^%]+?)\1/,
}

const INCH_CM = 2.54
const units: Record<string, number> = {
  in: 96,
  cm: 96 / INCH_CM,
  em: 16,
  ex: 8,
  m: (96 / INCH_CM) * 100,
  mm: 96 / INCH_CM / 10,
  pc: 96 / 72 / 12,
  pt: 96 / 72,
  px: 1,
}

const unitsReg = new RegExp(
  `^([0-9.]+(?:e\\d+)?)(${Object.keys(units).join('|')})?$`,
)

function parseLength(len: string) {
  const m = unitsReg.exec(len)
  if (!m) {
    return undefined
  }
  return Math.round(Number(m[1]) * (units[m[2]] || 1))
}

function parseViewbox(viewbox: string): IAttributes {
  const bounds = viewbox.split(' ')
  return {
    height: parseLength(bounds[3])!,
    width: parseLength(bounds[2])!,
  }
}

function parseAttributes(root: string): IAttributes {
  const width = extractorRegExps.width.exec(root)
  const height = extractorRegExps.height.exec(root)
  const viewbox = extractorRegExps.viewbox.exec(root)
  return {
    height: height && (parseLength(height[2])!),
    viewbox: viewbox && (parseViewbox(viewbox[2]) as IAttributes),
    width: width && (parseLength(width[2])!),
  }
}

function calculateByDimensions(attrs: IAttributes): ISize {
  return {
    height: attrs.height!,
    width: attrs.width!,
  }
}

function calculateByViewbox(attrs: IAttributes, viewbox: IAttributes): ISize {
  const ratio = (viewbox.width!) / (viewbox.height!)
  if (attrs.width) {
    return {
      height: Math.floor(attrs.width / ratio),
      width: attrs.width,
    }
  }
  if (attrs.height) {
    return {
      height: attrs.height,
      width: Math.floor(attrs.height * ratio),
    }
  }
  return {
    height: viewbox.height!,
    width: viewbox.width!,
  }
}

/**
 * Returns the byte offset of the first `<svg` followed by whitespace before `end`, or -1.
 */
function findSvgStart(input: Uint8Array, end: number): number {
  const head = input.subarray(0, end)
  for (let i = head.indexOf(0x3c); i !== -1; i = head.indexOf(0x3c, i + 1)) {
    if (svgStartReg.test(toUTF8String(input, i, i + 5))) {
      return i
    }
  }
  return -1
}

/**
 * Returns whether the tag opened at byte offset `start` is closed by a `>` outside quoted
 * attribute values, accepting the same tags as `svgReg` in a single pass over the input.
 */
function isTagClosed(input: Uint8Array, start: number): boolean {
  // `"`, `'` and `>` are ASCII, and UTF-8 never uses ASCII bytes inside multi-byte sequences.
  let quote = 0
  for (let i = start; i < input.length; i++) {
    const byte = input[i]
    if (quote !== 0) {
      if (byte === quote) {
        quote = 0
      }
    } else if (byte === 0x22 || byte === 0x27) {
      quote = byte
    } else if (byte === 0x3e) {
      return true
    }
  }
  return false
}

export const SVG: IImage = {
  validate: (input) => {
    // Scan only the first kilo-byte to speed up the check on larger files
    if (svgReg.test(toUTF8String(input, 0, 1000))) {
      return true
    }
    // The root tag can start within the first kilo-byte but end after it,
    // e.g. when it carries a large attribute such as draw.io's `content`.
    // A single pass rather than `svgReg`, which retries from every `<svg` and takes quadratic
    // time on a long input without a closing `>`.
    const start = findSvgStart(input, 1000)
    return start !== -1 && isTagClosed(input, start)
  },

  calculate(input) {
    const root = extractorRegExps.root.exec(toUTF8String(input))
    if (root) {
      const attrs = parseAttributes(root[0])
      if (attrs.width != null && attrs.height != null) {
        return calculateByDimensions(attrs)
      }
      if (attrs.viewbox) {
        return calculateByViewbox(attrs, attrs.viewbox)
      }
    }
    throw new TypeError('Invalid SVG')
  },
}
