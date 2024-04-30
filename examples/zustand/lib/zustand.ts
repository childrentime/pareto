import { createContext } from "react";

export const zustandContext = createContext<any | null>(null);
export const ZustandProvider = zustandContext.Provider;