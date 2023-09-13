import type { IImage } from './interface.js'

export const PSD: IImage = {
  validate(buffer) {
    return ('8BPS' === buffer.toString('ascii', 0, 4))
  },

  calculate(buffer) {
    return {
      height: buffer.readUInt32BE(14),
      width: buffer.readUInt32BE(18)
    }
  }
}
