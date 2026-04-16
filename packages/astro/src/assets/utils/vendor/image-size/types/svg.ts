import type { IImage, ISize } from './interface.ts'
import { toUTF8String } from './utils.js'

interface IAttributes {
  width: number | null
  height: number | null
  viewbox?: IAttributes | null
}

const svgReg = /<svg\s([^>"']|"[^"]*"|'[^']*')*>/

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

export const SVG: IImage = {
  // Scan only the first kilo-byte to speed up the check on larger files
  validate: (input) => svgReg.test(toUTF8String(input, 0, 1000)),

  calculate(input) {
    const root = extractorRegExps.root.exec(toUTF8String(input))
    if (root) {
      const attrs = parseAttributes(root[0])
      if (attrs.width && attrs.height) {
        return calculateByDimensions(attrs)
      }
      if (attrs.viewbox) {
        return calculateByViewbox(attrs, attrs.viewbox)
      }
    }
    throw new TypeError('Invalid SVG')
  },
}
