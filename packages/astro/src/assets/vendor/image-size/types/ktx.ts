import type { IImage } from './interface.js'

const SIGNATURE = 'KTX 11'

export const KTX: IImage = {
  validate(buffer) {
    return SIGNATURE === buffer.toString('ascii', 1, 7)
  },

  calculate(buffer) {
    return {
      height: buffer.readUInt32LE(40),
      width: buffer.readUInt32LE(36),
    }
  }
}
