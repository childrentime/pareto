import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["main.ts", "node.ts"],
  clean: true,
  splitting: true,
  outDir: "dist",
  format: ["cjs", "esm"],
  shims: true,
  dts: true,
  ignoreWatch: ["dist", "**/node_modules"],
});
