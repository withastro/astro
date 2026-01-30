import type { IImage } from './interface.ts'
import { readUInt32LE, toUTF8String } from './utils.js'

export const KTX: IImage = {
  validate: (input) => {
    const signature = toUTF8String(input, 1, 7)
    return ['KTX 11', 'KTX 20'].includes(signature)
  },

  calculate: (input) => {
    const type = input[5] === 0x31 ? 'ktx' : 'ktx2'
    const offset = type === 'ktx' ? 36 : 20
    return {
      height: readUInt32LE(input, offset + 4),
      width: readUInt32LE(input, offset),
      type,
    }
  },
}
