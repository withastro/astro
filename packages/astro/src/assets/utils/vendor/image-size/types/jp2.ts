import type { IImage } from './interface.ts'
import { findBox, readUInt32BE, toUTF8String } from './utils.js'

export const JP2: IImage = {
  validate(input) {
    const boxType = toUTF8String(input, 4, 8)
    if (boxType !== 'jP  ') return false

    const ftypBox = findBox(input, 'ftyp', 0)
    if (!ftypBox) return false

    const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12)
    return brand === 'jp2 '
  },

  calculate(input) {
    const jp2hBox = findBox(input, 'jp2h', 0)
    const ihdrBox = jp2hBox && findBox(input, 'ihdr', jp2hBox.offset + 8)
    if (ihdrBox) {
      return {
        height: readUInt32BE(input, ihdrBox.offset + 8),
        width: readUInt32BE(input, ihdrBox.offset + 12),
      }
    }
    throw new TypeError('Unsupported JPEG 2000 format')
  },
}
