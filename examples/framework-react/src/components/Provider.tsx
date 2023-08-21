import { createContext } from "react";

export const Context = createContext<{ count: number }>({ count: 0 });
