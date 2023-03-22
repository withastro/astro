import { typeHandlers, type imageType } from './types.js'

const keys = Object.keys(typeHandlers) as imageType[]

// This map helps avoid validating for every single image type
const firstBytes: { [byte: number]: imageType } = {
  0x38: 'psd',
  0x42: 'bmp',
  0x44: 'dds',
  0x47: 'gif',
  0x49: 'tiff',
  0x4d: 'tiff',
  0x52: 'webp',
  0x69: 'icns',
  0x89: 'png',
  0xff: 'jpg'
}

export function detector(buffer: Buffer): imageType | undefined {
  const byte = buffer[0]
  if (byte in firstBytes) {
    const type = firstBytes[byte]
    if (type && typeHandlers[type].validate(buffer)) {
      return type
    }
  }

  const finder = (key: imageType) => typeHandlers[key].validate(buffer)
  return keys.find(finder)
}
