import type { IImage } from './interface'
import { readUInt32BE, toUTF8String } from './utils'

export const PSD: IImage = {
  validate: (input) => toUTF8String(input, 0, 4) === '8BPS',

  calculate: (input) => ({
    height: readUInt32BE(input, 14),
    width: readUInt32BE(input, 18),
  }),
}
