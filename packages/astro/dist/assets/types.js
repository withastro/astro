const isESMImport = /* @__PURE__ */ Symbol('#isESM');
function isImageMetadata(src) {
	return src.fsPath && !('fsPath' in src);
}
export { isImageMetadata };
