import type { IImage } from './interface.js'

export const DDS: IImage = {
  validate(buffer) {
    return buffer.readUInt32LE(0) === 0x20534444
  },

  calculate(buffer) {
    return {
      height: buffer.readUInt32LE(12),
      width: buffer.readUInt32LE(16)
    }
  }
}
