import { useState } from "react";
import { jsx } from "react/jsx-runtime";
import { clsx } from "clsx";

export default function Counter() {
  const [count, setCount] = useState(0);
  return jsx("button", {
    id: "counter",
    className: clsx("btn"),
    onClick: () => setCount(c => c + 1),
    children: ["Count: ", count]
  });
}
