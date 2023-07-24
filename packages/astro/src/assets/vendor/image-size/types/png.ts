import type { IImage } from './interface.js'

const pngSignature = 'PNG\r\n\x1a\n'
const pngImageHeaderChunkName = 'IHDR'

// Used to detect "fried" png's: http://www.jongware.com/pngdefry.html
const pngFriedChunkName = 'CgBI'

export const PNG: IImage = {
  validate(buffer) {
    if (pngSignature === buffer.toString('ascii', 1, 8)) {
      let chunkName = buffer.toString('ascii', 12, 16)
      if (chunkName === pngFriedChunkName) {
        chunkName = buffer.toString('ascii', 28, 32)
      }
      if (chunkName !== pngImageHeaderChunkName) {
        throw new TypeError('Invalid PNG')
      }
      return true
    }
    return false
  },

  calculate(buffer) {
    if (buffer.toString('ascii', 12, 16) === pngFriedChunkName) {
      return {
        height: buffer.readUInt32BE(36),
        width: buffer.readUInt32BE(32)
      }
    }
    return {
      height: buffer.readUInt32BE(20),
      width: buffer.readUInt32BE(16)
    }
  }
}
