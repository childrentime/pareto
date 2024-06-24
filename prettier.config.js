/** @typedef {import("prettier").Config} PrettierConfig */

/** @type { PrettierConfig  } */
const config = {
  plugins: ['prettier-plugin-organize-imports'],
  semi: false,
  singleQuote: true,
  arrowParens: 'avoid',
}

module.exports = config
