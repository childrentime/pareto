import { ParetoRuntimeConfig } from "../types";


let config: ParetoRuntimeConfig = { pages: {},assets: {} };

export const getRuntimeConfig = (): ParetoRuntimeConfig => config;

export const setRuntimeConfig = (value: ParetoRuntimeConfig) => {
  config = value;
};
