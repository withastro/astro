const decoder = new TextDecoder()
export const toUTF8String = (
  input: Uint8Array,
  start = 0,
  end = input.length,
) => decoder.decode(input.slice(start, end))

export const toHexString = (input: Uint8Array, start = 0, end = input.length) =>
  input
    .slice(start, end)
    .reduce((memo, i) => memo + `0${i.toString(16)}`.slice(-2), '')

const getView = (input: Uint8Array, offset: number) =>
  new DataView(input.buffer, input.byteOffset + offset)

export const readInt16LE = (input: Uint8Array, offset = 0) =>
  getView(input, offset).getInt16(0, true)

export const readUInt16BE = (input: Uint8Array, offset = 0) =>
  getView(input, offset).getUint16(0, false)

export const readUInt16LE = (input: Uint8Array, offset = 0) =>
  getView(input, offset).getUint16(0, true)

// DataView doesn't have 24-bit methods
export const readUInt24LE = (input: Uint8Array, offset = 0) => {
  const view = getView(input, offset)
  return view.getUint16(0, true) + (view.getUint8(2) << 16)
}

export const readInt32LE = (input: Uint8Array, offset = 0) =>
  getView(input, offset).getInt32(0, true)

export const readUInt32BE = (input: Uint8Array, offset = 0) =>
  getView(input, offset).getUint32(0, false)

export const readUInt32LE = (input: Uint8Array, offset = 0) =>
  getView(input, offset).getUint32(0, true)

export const readUInt64 = (
  input: Uint8Array,
  offset: number,
  isBigEndian: boolean,
): bigint => getView(input, offset).getBigUint64(0, !isBigEndian)

// Abstract reading multi-byte unsigned integers
const methods = {
  readUInt16BE,
  readUInt16LE,
  readUInt32BE,
  readUInt32LE,
} as const

type MethodName = keyof typeof methods
export function readUInt(
  input: Uint8Array,
  bits: 16 | 32,
  offset = 0,
  isBigEndian = false,
): number {
  const endian = isBigEndian ? 'BE' : 'LE'
  const methodName = `readUInt${bits}${endian}` as MethodName
  return methods[methodName](input, offset)
}

const MIN_BOX_HEADER = 8

function readBox(input: Uint8Array, offset: number) {
  if (input.length - offset < MIN_BOX_HEADER) return
  const boxSize = readUInt32BE(input, offset)

  // ISO BMFF: size 0 means the box extends to the end of the file
  if (boxSize === 0) {
    return {
      name: toUTF8String(input, offset + 4, offset + 8),
      offset,
      size: input.length - offset,
    }
  }

  // ISO BMFF: size 1 signals a 64-bit largesize box, which is not supported
  if (boxSize === 1) return
  if (boxSize < MIN_BOX_HEADER) return
  if (input.length - offset < boxSize) return

  return {
    name: toUTF8String(input, offset + 4, offset + 8),
    offset,
    size: boxSize,
  }
}

export function findBox(input: Uint8Array, boxName: string, startOffset: number) {
  let offset = startOffset
  while (offset < input.length) {
    const box = readBox(input, offset)
    if (!box) break
    if (box.name === boxName) return box
    if (box.size < MIN_BOX_HEADER) break
    const nextOffset = offset + box.size
    if (nextOffset <= offset) break
    offset = nextOffset
  }
}
