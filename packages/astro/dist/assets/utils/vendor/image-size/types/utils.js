const decoder = new TextDecoder();
const toUTF8String = (input, start = 0, end = input.length) =>
	decoder.decode(input.slice(start, end));
const toHexString = (input, start = 0, end = input.length) =>
	input.slice(start, end).reduce((memo, i) => memo + `0${i.toString(16)}`.slice(-2), '');
const getView = (input, offset) => new DataView(input.buffer, input.byteOffset + offset);
const readInt16LE = (input, offset = 0) => getView(input, offset).getInt16(0, true);
const readUInt16BE = (input, offset = 0) => getView(input, offset).getUint16(0, false);
const readUInt16LE = (input, offset = 0) => getView(input, offset).getUint16(0, true);
const readUInt24LE = (input, offset = 0) => {
	const view = getView(input, offset);
	return view.getUint16(0, true) + (view.getUint8(2) << 16);
};
const readInt32LE = (input, offset = 0) => getView(input, offset).getInt32(0, true);
const readUInt32BE = (input, offset = 0) => getView(input, offset).getUint32(0, false);
const readUInt32LE = (input, offset = 0) => getView(input, offset).getUint32(0, true);
const readUInt64 = (input, offset, isBigEndian) =>
	getView(input, offset).getBigUint64(0, !isBigEndian);
const methods = {
	readUInt16BE,
	readUInt16LE,
	readUInt32BE,
	readUInt32LE,
};
function readUInt(input, bits, offset = 0, isBigEndian = false) {
	const endian = isBigEndian ? 'BE' : 'LE';
	const methodName = `readUInt${bits}${endian}`;
	return methods[methodName](input, offset);
}
function readBox(input, offset) {
	if (input.length - offset < 4) return;
	const boxSize = readUInt32BE(input, offset);
	if (input.length - offset < boxSize) return;
	return {
		name: toUTF8String(input, 4 + offset, 8 + offset),
		offset,
		size: boxSize,
	};
}
function findBox(input, boxName, currentOffset) {
	while (currentOffset < input.length) {
		const box = readBox(input, currentOffset);
		if (!box) break;
		if (box.name === boxName) return box;
		currentOffset += box.size > 0 ? box.size : 8;
	}
}
export {
	findBox,
	readInt16LE,
	readInt32LE,
	readUInt,
	readUInt16BE,
	readUInt16LE,
	readUInt24LE,
	readUInt32BE,
	readUInt32LE,
	readUInt64,
	toHexString,
	toUTF8String,
};
