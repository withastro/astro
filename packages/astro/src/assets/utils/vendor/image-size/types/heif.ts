import type { IImage } from './interface.ts'
import { findBox, readUInt32BE, toUTF8String } from './utils.js'

const brandMap = {
  avif: 'avif',
  mif1: 'heif',
  msf1: 'heif', // hief-sequence
  heic: 'heic',
  heix: 'heic',
  hevc: 'heic', // heic-sequence
  hevx: 'heic', // heic-sequence
}

export const HEIF: IImage = {
  validate(buffer) {
    const ftype = toUTF8String(buffer, 4, 8)
    const brand = toUTF8String(buffer, 8, 12)
    return 'ftyp' === ftype && brand in brandMap
  },

  calculate(buffer) {
    // Based on https://nokiatech.github.io/heif/technical.html
    const metaBox = findBox(buffer, 'meta', 0)
    const iprpBox = metaBox && findBox(buffer, 'iprp', metaBox.offset + 12)
    const ipcoBox = iprpBox && findBox(buffer, 'ipco', iprpBox.offset + 8)
    const ispeBox = ipcoBox && findBox(buffer, 'ispe', ipcoBox.offset + 8)
    if (ispeBox) {
      return {
        height: readUInt32BE(buffer, ispeBox.offset + 16),
        width: readUInt32BE(buffer, ispeBox.offset + 12),
        type: toUTF8String(buffer, 8, 12),
      }
    }
    throw new TypeError('Invalid HEIF, no size found')
  }
}
