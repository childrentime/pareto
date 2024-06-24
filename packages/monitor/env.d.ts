type CSSModuleClasses = Readonly<Record<string, string>>

declare module '*.module.scss' {
  const classes: CSSModuleClasses
  export default classes
}

declare module '*.png'

declare module 'htmlescape'
