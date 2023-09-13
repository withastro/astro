import type { IImage } from './interface.js'

const gifRegexp = /^GIF8[79]a/
export const GIF: IImage = {
  validate(buffer) {
    const signature = buffer.toString('ascii', 0, 6)
    return (gifRegexp.test(signature))
  },

  calculate(buffer) {
    return {
      height: buffer.readUInt16LE(8),
      width: buffer.readUInt16LE(6)
    }
  }
}
