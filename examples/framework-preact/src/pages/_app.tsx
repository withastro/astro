import { Context } from "../components/Context";
import { useState } from "preact/hooks";

export default function ({ children }) {
	const [count, setCount] = useState(0);
	const increment = () => setCount(v => v + 1)
	const decrement = () => setCount(v => v - 1);

	return <Context.Provider value={{ count, increment, decrement }}>{children}</Context.Provider>
}
