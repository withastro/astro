import type { IImage } from './interface'
import { readUInt32LE } from './utils'

export const DDS: IImage = {
  validate: (input) => readUInt32LE(input, 0) === 0x20534444,

  calculate: (input) => ({
    height: readUInt32LE(input, 12),
    width: readUInt32LE(input, 16),
  }),
}
