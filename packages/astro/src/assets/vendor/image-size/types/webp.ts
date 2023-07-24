// based on https://developers.google.com/speed/webp/docs/riff_container
import type { IImage, ISize } from './interface.js'

function calculateExtended(buffer: Buffer): ISize {
  return {
    height: 1 + buffer.readUIntLE(7, 3),
    width: 1 + buffer.readUIntLE(4, 3)
  }
}

function calculateLossless(buffer: Buffer): ISize {
  return {
    height: 1 + (((buffer[4] & 0xF) << 10) | (buffer[3] << 2) | ((buffer[2] & 0xC0) >> 6)),
    width: 1 + (((buffer[2] & 0x3F) << 8) | buffer[1])
  }
}

function calculateLossy(buffer: Buffer): ISize {
  // `& 0x3fff` returns the last 14 bits
  // TO-DO: include webp scaling in the calculations
  return {
    height: buffer.readInt16LE(8) & 0x3fff,
    width: buffer.readInt16LE(6) & 0x3fff
  }
}

export const WEBP: IImage = {
  validate(buffer) {
    const riffHeader = 'RIFF' === buffer.toString('ascii', 0, 4)
    const webpHeader = 'WEBP' === buffer.toString('ascii', 8, 12)
    const vp8Header  = 'VP8'  === buffer.toString('ascii', 12, 15)
    return (riffHeader && webpHeader && vp8Header)
  },

  calculate(buffer) {
    const chunkHeader = buffer.toString('ascii', 12, 16)
    buffer = buffer.slice(20, 30)

    // Extended webp stream signature
    if (chunkHeader === 'VP8X') {
      const extendedHeader = buffer[0]
      const validStart = (extendedHeader & 0xc0) === 0
      const validEnd = (extendedHeader & 0x01) === 0
      if (validStart && validEnd) {
        return calculateExtended(buffer)
      } else {
        // TODO: breaking change
        throw new TypeError('Invalid WebP')
      }
    }

    // Lossless webp stream signature
    if (chunkHeader === 'VP8 ' && buffer[0] !== 0x2f) {
      return calculateLossy(buffer)
    }

    // Lossy webp stream signature
    const signature = buffer.toString('hex', 3, 6)
    if (chunkHeader === 'VP8L' && signature !== '9d012a') {
      return calculateLossless(buffer)
    }

    throw new TypeError('Invalid WebP')
  }
}
