type CSSModuleClasses = { readonly [key: string]: string }

declare module '*.module.scss' {
  const classes: CSSModuleClasses
  export default classes
}