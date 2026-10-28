import { BitReader } from '../utils/bit-reader.js'
import type { IImage } from './interface.ts'
import { toHexString } from './utils.js'

function calculateImageDimension(
  reader: BitReader,
  isSmallImage: boolean,
): number {
  if (isSmallImage) {
    // Small images are multiples of 8 pixels, up to 256 pixels
    return 8 * (1 + reader.getBits(5))
  }
  // Larger images use a variable bit-length encoding
  const sizeClass = reader.getBits(2)
  const extraBits = [9, 13, 18, 30][sizeClass]
  return 1 + reader.getBits(extraBits)
}

function calculateImageWidth(
  reader: BitReader,
  isSmallImage: boolean,
  widthMode: number,
  height: number,
): number {
  if (isSmallImage && widthMode === 0) {
    // Small square images
    return 8 * (1 + reader.getBits(5))
  }
  if (widthMode === 0) {
    // Non-small images with explicitly coded width
    return calculateImageDimension(reader, false)
  }
  // Images with width derived from height and aspect ratio
  const aspectRatios = [1, 1.2, 4 / 3, 1.5, 16 / 9, 5 / 4, 2]
  return Math.floor(height * aspectRatios[widthMode - 1])
}

export const JXLStream: IImage = {
  validate: (input) => {
    return toHexString(input, 0, 2) === 'ff0a'
  },

  calculate(input) {
    const reader = new BitReader(input, 'little-endian')
    const isSmallImage = reader.getBits(1) === 1
    const height = calculateImageDimension(reader, isSmallImage)
    const widthMode = reader.getBits(3)
    const width = calculateImageWidth(reader, isSmallImage, widthMode, height)
    return { width, height }
  },
}
