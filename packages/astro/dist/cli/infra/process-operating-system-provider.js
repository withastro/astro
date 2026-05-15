class ProcessOperatingSystemProvider {
	#platformToOs = {
		darwin: 'macOS',
		win32: 'Windows',
		linux: 'Linux',
	};
	name = process.platform;
	displayName = `${this.#platformToOs[this.name] ?? this.name} (${process.arch})`;
}
export { ProcessOperatingSystemProvider };
