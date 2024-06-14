import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["main.ts", "node.ts", "client.ts"],
  clean: true,
  splitting: true,
  outDir: "dist",
  format: ["cjs", "esm"],
  shims: true,
  dts: true,
  ignoreWatch: ["dist", "**/node_modules"],
  external: [
    "react",
    "react-dom",
    "react-helmet-async",
    "@paretojs/monitor",
    "superjson",
  ],
  minify: 'terser'
});
