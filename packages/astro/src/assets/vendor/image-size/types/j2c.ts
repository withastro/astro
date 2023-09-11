import type { IImage } from './interface'

export const J2C: IImage = {
  validate(buffer) {
    // TODO: this doesn't seem right. SIZ marker doesn't have to be right after the SOC
    return buffer.toString('hex', 0, 4) === 'ff4fff51'
  },

  calculate(buffer) {
    return {
      height: buffer.readUInt32BE(12),
      width: buffer.readUInt32BE(8),
    }
  }
}
