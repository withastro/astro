import type { IImage, ISize, ISizeCalculationResult } from './interface'

const TYPE_ICON = 1

/**
 * ICON Header
 *
 * | Offset | Size | Purpose |
 * | 0	    | 2    | Reserved. Must always be 0.  |
 * | 2      | 2    | Image type: 1 for icon (.ICO) image, 2 for cursor (.CUR) image. Other values are invalid. |
 * | 4      | 2    | Number of images in the file. |
 *
 */
const SIZE_HEADER = 2 + 2 + 2 // 6

/**
 * Image Entry
 *
 * | Offset | Size | Purpose |
 * | 0	    | 1    | Image width in pixels. Can be any number between 0 and 255. Value 0 means width is 256 pixels. |
 * | 1      | 1    | Image height in pixels. Can be any number between 0 and 255. Value 0 means height is 256 pixels. |
 * | 2      | 1    | Number of colors in the color palette. Should be 0 if the image does not use a color palette. |
 * | 3      | 1    | Reserved. Should be 0. |
 * | 4      | 2    | ICO format: Color planes. Should be 0 or 1. |
 * |        |      | CUR format: The horizontal coordinates of the hotspot in number of pixels from the left. |
 * | 6      | 2    | ICO format: Bits per pixel. |
 * |        |      | CUR format: The vertical coordinates of the hotspot in number of pixels from the top. |
 * | 8      | 4    | The size of the image's data in bytes |
 * | 12     | 4    | The offset of BMP or PNG data from the beginning of the ICO/CUR file |
 *
 */
const SIZE_IMAGE_ENTRY = 1 + 1 + 1 + 1 + 2 + 2 + 4 + 4 // 16

function getSizeFromOffset(buffer: Buffer, offset: number): number {
  const value = buffer.readUInt8(offset)
  return value === 0 ? 256 : value
}

function getImageSize(buffer: Buffer, imageIndex: number): ISize {
  const offset = SIZE_HEADER + (imageIndex * SIZE_IMAGE_ENTRY)
  return {
    height: getSizeFromOffset(buffer, offset + 1),
    width: getSizeFromOffset(buffer, offset)
  }
}

export const ICO: IImage = {
  validate(buffer) {
    if (buffer.readUInt16LE(0) !== 0) {
      return false
    }
    return buffer.readUInt16LE(2) === TYPE_ICON
  },

  calculate(buffer) {
    const nbImages = buffer.readUInt16LE(4)
    const imageSize = getImageSize(buffer, 0)

    if (nbImages === 1) {
      return imageSize
    }

    const imgs: ISize[] = [imageSize]
    for (let imageIndex = 1; imageIndex < nbImages; imageIndex += 1) {
      imgs.push(getImageSize(buffer, imageIndex))
    }

    const result: ISizeCalculationResult = {
      height: imageSize.height,
      images: imgs,
      width: imageSize.width
    }

    return result
  }
}
