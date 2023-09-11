type Bits = 16 | 32
type MethodName = 'readUInt16BE' | 'readUInt16LE' | 'readUInt32BE' | 'readUInt32LE'

// Abstract reading multi-byte unsigned integers
export function readUInt(buffer: Buffer, bits: Bits, offset: number, isBigEndian: boolean): number {
  offset = offset || 0
  const endian = isBigEndian ? 'BE' : 'LE'
  const methodName: MethodName = ('readUInt' + bits + endian) as MethodName
  return buffer[methodName].call(buffer, offset)
}
