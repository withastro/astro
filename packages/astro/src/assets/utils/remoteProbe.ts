/**
 * https://github.com/image-size/image-size/blob/main/LICENSE
 * @license MIT
 *
 * Copyright (c) 2016-23 [these people](https://github.com/image-size/image-size/graphs/contributors)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

type ImageSize = {
	width: number;
	height: number;
};
const parseWebp = (data: Uint8Array): ImageSize | false => {
	const readUInt16LE = (input: Uint8Array, offset: number): number =>
		input[offset] + (input[offset + 1] << 8);

	const readUInt24LE = (input: Uint8Array, offset: number): number =>
		input[offset] + (input[offset + 1] << 8) + (input[offset + 2] << 16);

	const toUTF8String = (input: Uint8Array, offset: number, length: number): string =>
		new TextDecoder().decode(input.subarray(offset, offset + length));

	// Specific format calculations
	const calculateExtended = (input: Uint8Array): { width: number; height: number } => ({
		width: 1 + readUInt24LE(input, 4),
		height: 1 + readUInt24LE(input, 7),
	});

	const calculateLossless = (input: Uint8Array): { width: number; height: number } => ({
		width: 1 + (input[1] | ((input[2] & 0x3f) << 8)),
		height: 1 + (((input[2] & 0xf0) >> 4) | (input[3] << 4) | ((input[4] & 0x3) << 12)),
	});

	const calculateLossy = (input: Uint8Array): { width: number; height: number } => ({
		width: readUInt16LE(input, 6) & 0x3fff,
		height: readUInt16LE(input, 8) & 0x3fff,
	});

	if (!('RIFF' === toUTF8String(data, 0, 4) && 'WEBP' === toUTF8String(data, 8, 4))) {
		return false;
	}

	// Skip RIFF header and size (4 + 4 bytes), WebP header (4 bytes)
	let offset = 12;
	while (offset < data.length) {
		const chunkType = toUTF8String(data, offset, 4);
		const chunkSize = readUInt24LE(data, offset + 4);
		offset += 8; // Move past chunk header

		switch (chunkType) {
			case 'VP8X': // Extended format
				return {
					...calculateExtended(data.subarray(offset, offset + chunkSize)),
				};
			case 'VP8 ': // Lossy format
				return {
					...calculateLossy(data.subarray(offset, offset + chunkSize)),
				};
			case 'VP8L': // Lossless format
				return {
					...calculateLossless(data.subarray(offset, offset + chunkSize)),
				};
		}

		offset += chunkSize; // Skip to next chunk
	}
	return false;
};

// This function should work for all heif images but only avif is supported by sharp
const parseHeif = (data: Uint8Array): ImageSize | false => {
	const toUTF8String = (input: Uint8Array, start = 0, end = input.length) =>
		new TextDecoder().decode(input.slice(start, end));

	const readUInt32BE = (input: Uint8Array, offset = 0) =>
		input[offset] * 16777216 +
		input[offset + 1] * 65536 +
		input[offset + 2] * 256 +
		input[offset + 3];

	function readBox(buffer: Uint8Array, offset: number) {
		if (buffer.length - offset < 4) return;
		const boxSize = readUInt32BE(buffer, offset);
		if (buffer.length - offset < boxSize) return;
		return {
			name: toUTF8String(buffer, 4 + offset, 8 + offset),
			offset,
			size: boxSize,
		};
	}

	function findBox(buffer: Uint8Array, boxName: string, offset: number) {
		while (offset < buffer.length) {
			const box = readBox(buffer, offset);
			if (!box) break;
			if (box.name === boxName) return box;
			offset += box.size;
		}
	}
	// Find the 'meta' box
	const metaBox = findBox(data, 'meta', 0);
	if (!metaBox) return false;

	// Within 'meta', find 'iprp'
	const iprpBox = findBox(data, 'iprp', metaBox.offset + 12);
	if (!iprpBox) return false;

	// Within 'iprp', find 'ipco'
	const ipcoBox = findBox(data, 'ipco', iprpBox.offset + 8);
	if (!ipcoBox) return false;

	// Within 'ipco', find 'ispe'
	const ispeBox = findBox(data, 'ispe', ipcoBox.offset + 8);
	if (!ispeBox) return false;

	// Extract the image dimensions from 'ispe'
	const width = readUInt32BE(data, ispeBox.offset + 16);
	const height = readUInt32BE(data, ispeBox.offset + 12);

	return { width, height };
};
const parseTiff = (data: Uint8Array): ImageSize | false => {
	// Helper functions
	const readUInt16 = (buffer: Uint8Array, offset: number, isBigEndian: boolean): number =>
		isBigEndian
			? buffer[offset] * 256 + buffer[offset + 1]
			: buffer[offset + 1] * 256 + buffer[offset];

	const readUInt32 = (buffer: Uint8Array, offset: number, isBigEndian: boolean): number => {
		const value = isBigEndian
			? (buffer[offset] << 24) |
				(buffer[offset + 1] << 16) |
				(buffer[offset + 2] << 8) |
				buffer[offset + 3]
			: (buffer[offset + 3] << 24) |
				(buffer[offset + 2] << 16) |
				(buffer[offset + 1] << 8) |
				buffer[offset];
		return value >>> 0; // Ensure unsigned int
	};

	// Check TIFF signature to determine endianness
	const isBigEndian = data[0] === 0x4d && data[1] === 0x4d;

	// Read IFD offset
	const ifdOffset = readUInt32(data, 4, isBigEndian);

	// Read the number of directory entries
	const entries = readUInt16(data, ifdOffset, isBigEndian);

	let width = 0,
		height = 0;

	for (let i = 0; i < entries; i++) {
		const entryOffset = ifdOffset + 2 + i * 12;
		const tag = readUInt16(data, entryOffset, isBigEndian);
		const type = readUInt16(data, entryOffset + 2, isBigEndian);

		if (tag === 0x0100 && type === 3) {
			// Image width tag and type SHORT
			width = readUInt16(data, entryOffset + 8, isBigEndian);
		} else if (tag === 0x0101 && type === 3) {
			// Image height tag and type SHORT
			height = readUInt16(data, entryOffset + 8, isBigEndian);
		}
	}

	if (!width || !height) {
		return false;
	}

	return { width, height };
};
const parseSvg = (data: Uint8Array): ImageSize | false => {
	const text = new TextDecoder('utf-8').decode(data);

	const widthRegex = /width="([^"]+)"/;
	const heightRegex = /height="([^"]+)"/;
	const viewBoxRegex = /viewBox="([^"]+)"/;

	const widthMatch = text.match(widthRegex);
	const heightMatch = text.match(heightRegex);
	const viewBoxMatch = text.match(viewBoxRegex);

	let width: number | null = null;
	let height: number | null = null;

	if (viewBoxMatch) {
		const values = viewBoxMatch[1].split(' ');
		width = parseFloat(values[2]);
		height = parseFloat(values[3]);
	} else {
		width = widthMatch ? parseFloat(widthMatch[1]) : null;
		height = heightMatch ? parseFloat(heightMatch[1]) : null;
	}

	if (width !== null && height !== null) {
		return { width, height };
	} else {
		return false;
	}
};
const parseGif = (data: Uint8Array): ImageSize | false => {
	try {
		const width = data[6] | (data[7] << 8);
		const height = data[8] | (data[9] << 8);
		return {
			width,
			height,
		};
	} catch {
		return false;
	}
};
const parsePng = (data: Uint8Array): ImageSize | false => {
	try {
		let chunkNameOffset = 12; // Default position for chunk name
		let widthHeightOffset = 16; // Default position for width and height
		const chunkName = new TextDecoder('utf-8').decode(
			data.slice(chunkNameOffset, chunkNameOffset + 4)
		);
		if (chunkName === 'CgBI') {
			chunkNameOffset = 28; // Adjusted position for "fried" PNGs
			widthHeightOffset = 32; // Adjusted position for width and height
		}

		// Reading width and height
		const width =
			(data[widthHeightOffset] << 24) |
			(data[widthHeightOffset + 1] << 16) |
			(data[widthHeightOffset + 2] << 8) |
			data[widthHeightOffset + 3];
		const height =
			(data[widthHeightOffset + 4] << 24) |
			(data[widthHeightOffset + 5] << 16) |
			(data[widthHeightOffset + 6] << 8) |
			data[widthHeightOffset + 7];

		return {
			width,
			height,
		};
	} catch {
		return false;
	}
};
const parseJpeg = (data: Uint8Array): ImageSize | false => {
	// JPEG uses big endian for its markers and size fields
	try {
		const SOF0 = 0xc0; // Start Of Frame (Baseline DCT)
		const SOF2 = 0xc2; // Start Of Frame (Progressive DCT)

		let position = 2; // Start after the SOI marker

		while (position < data.length) {
			const marker = data[position + 1];
			const blockLength = (data[position + 2] << 8) | data[position + 3];

			if (marker === SOF0 || marker === SOF2) {
				const height = (data[position + 5] << 8) | data[position + 6];
				const width = (data[position + 7] << 8) | data[position + 8];
				return {
					width,
					height,
				};
			}

			position += blockLength + 2; // Move to the next marker
		}
	} catch {
		return false;
	}
	return false;
};
const parseBmp = (data: Uint8Array): ImageSize | false => {
  try {
    // Helper functions to read data in little-endian order
    const readUInt32LE = (input: Uint8Array, offset: number): number =>
      input[offset] |
      (input[offset + 1] << 8) |
      (input[offset + 2] << 16) |
      (input[offset + 3] << 24);

    const readInt32LE = (input: Uint8Array, offset: number): number =>
      (input[offset] |
        (input[offset + 1] << 8) |
        (input[offset + 2] << 16) |
        (input[offset + 3] << 24)) <<
      0; // Ensure signed integer

    // Calculate dimensions
    const width = readUInt32LE(data, 18);
    const height = Math.abs(readInt32LE(data, 22)); // Abs to handle negative heights

    // Return the image size and type
    return { width, height };
  } catch (error) {
    return false;
  }
};

const parseIco = (data: Uint8Array): ImageSize | false => {
  const readUInt16LE = (input: Uint8Array, offset: number): number =>
    input[offset] | (input[offset + 1] << 8);

  const TYPE_ICON = 1;
  const SIZE_HEADER = 6; // 2 bytes reserved, 2 bytes type, 2 bytes number of images
  const SIZE_IMAGE_ENTRY = 16; // Image entry size

  function getSizeFromOffset(input: Uint8Array, offset: number): number {
    const value = input[offset];
    return value === 0 ? 256 : value;
  }

  function getImageSize(input: Uint8Array, imageIndex: number): ImageSize {
    const offset = SIZE_HEADER + imageIndex * SIZE_IMAGE_ENTRY;
    const width = getSizeFromOffset(input, offset);
    const height = getSizeFromOffset(input, offset + 1);
    return { width, height };
  }
  try {
    const reserved = readUInt16LE(data, 0);
    const type = readUInt16LE(data, 2);
    const imageCount = readUInt16LE(data, 4);

    if (reserved !== 0 || type !== TYPE_ICON || imageCount === 0) {
      // Not a valid ICO file
      return false;
    }

    // We're only calculating the size of the first image.
    // This can be adapted if you need to handle multiple images within the ICO.
    return getImageSize(data, 0);
  } catch (error) {
    return false; // Error handling, return false if any step fails
  }
};
type ParseFunction = (data: Uint8Array) => ImageSize | false;
const parseFunctionMap: Record<string, ParseFunction> = {
  "image/webp": parseWebp,
  "image/heic": parseHeif,
  "image/heif": parseHeif,
  "image/avif": parseHeif,
  "image/tiff": parseTiff,
  "image/svg+xml": parseSvg,
  "image/gif": parseGif,
  "image/png": parsePng,
  "image/jpeg": parseJpeg,
  "image/bmp": parseBmp,
  "image/vnd.microsoft.icon": parseIco,
	"image/x-icon": parseIco,
};

export async function probe(url: string): Promise<ImageSize> {
	// Start fetching the image
	const response = await fetch(url);
	if (!response.body || !response.ok) {
		throw new Error('Failed to fetch image');
	}

	const reader = response.body.getReader();
	const contentType = response.headers.get('Content-Type') || '';
	const parseFunction = parseFunctionMap[contentType];

	if (!parseFunction) {
		await reader.cancel(); // Stop reading from the stream
		throw new Error('Unsupported file type');
	}

	let done: boolean | undefined, value: Uint8Array;
	let accumulatedChunks = new Uint8Array();

	// Process the stream chunk by chunk
	while (!done) {
		const readResult = await reader.read();
		done = readResult.done;

		if (done) break;

		if (readResult.value) {
			value = readResult.value;

			// Accumulate chunks
			let tmp = new Uint8Array(accumulatedChunks.length + value.length);
			tmp.set(accumulatedChunks, 0);
			tmp.set(value, accumulatedChunks.length);
			accumulatedChunks = tmp;

			// Attempt to parse accumulated data
			const result = parseFunction(accumulatedChunks);
			if (result !== false) {
				await reader.cancel(); // Stop reading from the stream as we have the size now
				return result; // Successfully parsed the chunk
			}
		}
	}

	throw new Error('Failed to parse the size');
}
