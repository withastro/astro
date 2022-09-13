import * as worker from './impl.js';
import type { OutputFormat } from '../../loaders/index.js';

type RotateOperation = {
  type: 'rotate'
  numRotations: number
}
type ResizeOperation = {
  type: 'resize'
	width?: number
	height?: number
}
export type Operation = RotateOperation | ResizeOperation

export async function processBuffer(
  buffer: Buffer,
  operations: Operation[],
  encoding: OutputFormat,
  quality: number
): Promise<Buffer> {
  let imageData = await worker.decodeBuffer(buffer)
  for (const operation of operations) {
    if (operation.type === 'rotate') {
      imageData = await worker.rotate(imageData, operation.numRotations)
    } else if (operation.type === 'resize') {
			imageData = await worker.resize({ image: imageData, height: operation.height, width: operation.width})
    }
  }

  switch (encoding) {
    case 'jpeg':
		case 'jpg':
      return await worker.encodeJpeg(imageData, { quality })
    case 'webp':
      return await worker.encodeWebp(imageData, { quality })
    case 'avif':
      return await worker.encodeAvif(imageData, { quality })
    case 'png':
      return await worker.encodePng(imageData)
    default:
      throw Error(`Unsupported encoding format`)
  }
}
