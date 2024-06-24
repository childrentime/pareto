import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: 'src/index.ts', // 这是你的入口文件
  output: [
    {
      file: 'dist/main.js', // 这是 CommonJS 格式的输出文件
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/main.mjs', // 这是 ES Module 格式的输出文件
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    postcss({
      extract: false,
      modules: true,
      use: ['sass'],
      minimize: true,
    }),
    terser(),
  ],
}
