import * as worker from './impl.js';
import type { OutputFormat } from '../../loaders/index.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

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

export async function copyLibFiles(dir: URL) {
	const src = new URL('./', import.meta.url);
	await copyLibDir(fileURLToPath(src), fileURLToPath(dir));
}

async function copyLibDir(src: string, dest: string) {
	const itemNames = await fs.readdir(src);
	await Promise.all(itemNames.map(async (srcName) => {
		const srcPath = path.join(src, srcName);
		const destPath = path.join(dest, srcName);
		const s = await fs.stat(srcPath);
		if (s.isFile() && /.wasm$/.test(srcPath)) {
			await fs.mkdir(path.dirname(destPath), { recursive: true });
			await fs.copyFile(srcPath, destPath);
		}
		else if (s.isDirectory()) {
			await copyLibDir(srcPath, destPath);
		}
}));
}
