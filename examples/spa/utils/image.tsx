import { preload as ReactDomPreload } from 'react-dom'

export type ImageProps = {
  preload?: boolean
  src: string
} & React.ImgHTMLAttributes<HTMLImageElement>

export const Image = (props: ImageProps) => {
  const { preload, ...rest } = props
  if (!rest.src) {
    throw new Error('Image component must have a src prop')
  }
  preload && ReactDomPreload(rest.src, { as: 'image' })
  return <img {...rest} />
}
