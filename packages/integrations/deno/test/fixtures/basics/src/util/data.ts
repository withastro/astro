export interface Data {
	foo: string;
}

export async function getData(): Promise<Data> {
	return new Promise((resolve, _reject) => {
		setTimeout(() => {
			resolve({ foo: "bar" });
		}, 100);
	});
}

// Testing top-level await, a feature supported in esnext
export const someData = await getData();
