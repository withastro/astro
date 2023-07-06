// based on http://www.compix.com/fileformattif.htm
// TO-DO: support big-endian as well
import * as fs from 'fs'
import { readUInt } from '../readUInt.js'
import type { IImage } from './interface'

// Read IFD (image-file-directory) into a buffer
function readIFD(buffer: Buffer, filepath: string, isBigEndian: boolean) {

  const ifdOffset = readUInt(buffer, 32, 4, isBigEndian)

  // read only till the end of the file
  let bufferSize = 1024
  const fileSize = fs.statSync(filepath).size
  if (ifdOffset + bufferSize > fileSize) {
    bufferSize = fileSize - ifdOffset - 10
  }

  // populate the buffer
  const endBuffer = Buffer.alloc(bufferSize)
  const descriptor = fs.openSync(filepath, 'r')
  fs.readSync(descriptor, endBuffer, 0, bufferSize, ifdOffset)
  fs.closeSync(descriptor)

  return endBuffer.slice(2)
}

// TIFF values seem to be messed up on Big-Endian, this helps
function readValue(buffer: Buffer, isBigEndian: boolean): number {
  const low = readUInt(buffer, 16, 8, isBigEndian)
  const high = readUInt(buffer, 16, 10, isBigEndian)
  return (high << 16) + low
}

// move to the next tag
function nextTag(buffer: Buffer) {
  if (buffer.length > 24) {
    return buffer.slice(12)
  }
}

// Extract IFD tags from TIFF metadata
function extractTags(buffer: Buffer, isBigEndian: boolean) {
  const tags: {[key: number]: number} = {}

  let temp: Buffer | undefined = buffer
  while (temp?.length) {
    const code = readUInt(temp, 16, 0, isBigEndian)
    const type = readUInt(temp, 16, 2, isBigEndian)
    const length = readUInt(temp, 32, 4, isBigEndian)

    // 0 means end of IFD
    if (code === 0) {
      break
    } else {
      // 256 is width, 257 is height
      // if (code === 256 || code === 257) {
      if (length === 1 && (type === 3 || type === 4)) {
        tags[code] = readValue(temp, isBigEndian)
      }

      // move to the next tag
      temp = nextTag(temp)
    }
  }

  return tags
}

// Test if the TIFF is Big Endian or Little Endian
function determineEndianness(buffer: Buffer) {
  const signature = buffer.toString('ascii', 0, 2)
  if ('II' === signature) {
    return 'LE'
  } else if ('MM' === signature) {
    return 'BE'
  }
}

const signatures = [
  // '492049', // currently not supported
  '49492a00', // Little endian
  '4d4d002a', // Big Endian
  // '4d4d002a', // BigTIFF > 4GB. currently not supported
]

export const TIFF: IImage = {
  validate(buffer) {
    return signatures.includes(buffer.toString('hex', 0, 4))
  },

  calculate(buffer, filepath) {
    if (!filepath) {
      throw new TypeError('Tiff doesn\'t support buffer')
    }

    // Determine BE/LE
    const isBigEndian = determineEndianness(buffer) === 'BE'

    // read the IFD
    const ifdBuffer = readIFD(buffer, filepath, isBigEndian)

    // extract the tags from the IFD
    const tags = extractTags(ifdBuffer, isBigEndian)

    const width = tags[256]
    const height = tags[257]

    if (!width || !height) {
      throw new TypeError('Invalid Tiff. Missing tags')
    }

    return { height, width }
  }
}
