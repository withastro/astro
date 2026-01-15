import type { IImage, ISize } from './interface.ts'
import { JXLStream } from './jxl-stream.js'
import { findBox, toUTF8String } from './utils.js'

/** Extracts the codestream from a containerized JPEG XL image */
function extractCodestream(input: Uint8Array): Uint8Array | undefined {
  const jxlcBox = findBox(input, 'jxlc', 0)
  if (jxlcBox) {
    return input.slice(jxlcBox.offset + 8, jxlcBox.offset + jxlcBox.size)
  }

  const partialStreams = extractPartialStreams(input)
  if (partialStreams.length > 0) {
    return concatenateCodestreams(partialStreams)
  }

  return undefined
}

/** Extracts partial codestreams from jxlp boxes */
function extractPartialStreams(input: Uint8Array): Uint8Array[] {
  const partialStreams: Uint8Array[] = []
  let offset = 0
  while (offset < input.length) {
    const jxlpBox = findBox(input, 'jxlp', offset)
    if (!jxlpBox) break
    partialStreams.push(
      input.slice(jxlpBox.offset + 12, jxlpBox.offset + jxlpBox.size),
    )
    offset = jxlpBox.offset + jxlpBox.size
  }
  return partialStreams
}

/** Concatenates partial codestreams into a single codestream */
function concatenateCodestreams(partialCodestreams: Uint8Array[]): Uint8Array {
  const totalLength = partialCodestreams.reduce(
    (acc, curr) => acc + curr.length,
    0,
  )
  const codestream = new Uint8Array(totalLength)
  let position = 0
  for (const partial of partialCodestreams) {
    codestream.set(partial, position)
    position += partial.length
  }
  return codestream
}

export const JXL: IImage = {
  validate: (input: Uint8Array): boolean => {
    const boxType = toUTF8String(input, 4, 8)
    if (boxType !== 'JXL ') return false

    const ftypBox = findBox(input, 'ftyp', 0)
    if (!ftypBox) return false

    const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12)
    return brand === 'jxl '
  },

  calculate(input: Uint8Array): ISize {
    const codestream = extractCodestream(input)
    if (codestream) return JXLStream.calculate(codestream)
    throw new Error('No codestream found in JXL container')
  },
}
