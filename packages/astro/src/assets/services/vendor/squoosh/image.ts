import type { ImageOutputFormat } from '../../../types.js';
import * as impl from './impl.js';

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
  encoding: ImageOutputFormat,
  quality?: number
): Promise<Uint8Array> {
  let imageData = await impl.decodeBuffer(buffer)
  for (const operation of operations) {
    if (operation.type === 'rotate') {
			imageData = await impl.rotate(imageData, operation.numRotations);
    } else if (operation.type === 'resize') {
			imageData = await impl.resize({ image: imageData, width: operation.width, height: operation.height })
    }
  }

	switch (encoding) {
		case 'avif':
			return await impl.encodeAvif(imageData, { quality }) as Uint8Array;
		case 'jpeg':
		case 'jpg':
			return await impl.encodeJpeg(imageData, { quality }) as Uint8Array;
		case 'png':
			return await impl.encodePng(imageData) as Uint8Array;
		case 'webp':
			return await impl.encodeWebp(imageData, { quality }) as Uint8Array;
		default:
			throw Error(`Unsupported encoding format`)
	}
}
