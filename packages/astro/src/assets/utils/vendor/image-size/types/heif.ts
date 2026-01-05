import type { IImage, ISize } from './interface.ts'
import { findBox, readUInt32BE, toUTF8String } from './utils.js'

const brandMap = {
  avif: 'avif',
  avis: 'avif', // avif-sequence
  mif1: 'heif',
  msf1: 'heif', // heif-sequence
  heic: 'heic',
  heix: 'heic',
  hevc: 'heic', // heic-sequence
  hevx: 'heic', // heic-sequence
}

// Detect type by scanning ftyp box range, handling files with out-of-order brand entries
function detectType(input: Uint8Array, start: number, end: number): string | undefined {
  let hasAvif = false
  let hasHeic = false
  let hasHeif = false

  for (let i = start; i <= end; i += 4) {
    const brand = toUTF8String(input, i, i + 4)
    if (brand === 'avif' || brand === 'avis') hasAvif = true
    else if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || brand === 'hevx') hasHeic = true
    else if (brand === 'mif1' || brand === 'msf1') hasHeif = true
  }

  if (hasAvif) return 'avif'
  if (hasHeic) return 'heic'
  if (hasHeif) return 'heif'
}

export const HEIF: IImage = {
  validate(input) {
    const boxType = toUTF8String(input, 4, 8)
    if (boxType !== 'ftyp') return false

    const ftypBox = findBox(input, 'ftyp', 0)
    if (!ftypBox) return false

    const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12)
    return brand in brandMap
  },

  calculate(input) {
    // Based on https://nokiatech.github.io/heif/technical.html
    const metaBox = findBox(input, 'meta', 0)
    const iprpBox = metaBox && findBox(input, 'iprp', metaBox.offset + 12)
    const ipcoBox = iprpBox && findBox(input, 'ipco', iprpBox.offset + 8)

    if (!ipcoBox) {
      throw new TypeError('Invalid HEIF, no ipco box found')
    }

    const type = detectType(input, 8, metaBox!.offset)

    const images: ISize[] = []
    let currentOffset = ipcoBox.offset + 8

    // Find all ispe and clap boxes
    while (currentOffset < ipcoBox.offset + ipcoBox.size) {
      const ispeBox = findBox(input, 'ispe', currentOffset)
      if (!ispeBox) break

      const rawWidth = readUInt32BE(input, ispeBox.offset + 12)
      const rawHeight = readUInt32BE(input, ispeBox.offset + 16)

      // Look for a clap box after the ispe box
      const clapBox = findBox(input, 'clap', currentOffset)
      let width = rawWidth
      let height = rawHeight
      if (clapBox && clapBox.offset < ipcoBox.offset + ipcoBox.size) {
        const cropRight = readUInt32BE(input, clapBox.offset + 12)
        width = rawWidth - cropRight
      }

      images.push({ height, width })

      currentOffset = ispeBox.offset + ispeBox.size
    }

    if (images.length === 0) {
      throw new TypeError('Invalid HEIF, no sizes found')
    }

    return {
      width: images[0].width,
      height: images[0].height,
      type,
      ...(images.length > 1 ? { images } : {}),
    }
  },
}
