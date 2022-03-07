export function atob(data: string): string {
	return Buffer.from(data, 'base64').toString('binary')
}

export function btoa(data: string): string {
	return Buffer.from(data, 'binary').toString('base64')
}
