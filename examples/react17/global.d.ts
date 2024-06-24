type CSSModuleClasses = Readonly<Record<string, string>>

declare module '*.module.css' {
  const classes: CSSModuleClasses
  export = classes
  export default classes
}
declare module '*.module.scss' {
  const classes: CSSModuleClasses
  export = classes
  export default classes
}
