// CSS modules
type CSSModuleClasses = { readonly [key: string]: string }

declare module '*.module.css' {
  const classes: CSSModuleClasses
  export default classes
}
declare module '*.module.scss' {
  const classes: CSSModuleClasses
  export default classes
}

// CSS
declare module '*.css' {
  const css: string
  export default css
}
declare module '*.scss' {
  const css: string
  export default css
}