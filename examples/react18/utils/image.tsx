import { Helmet } from 'react-helmet-async'

export type ImageProps = {
  preload?: boolean
  src: string
} & React.ImgHTMLAttributes<HTMLImageElement>

export const Image = (props: ImageProps) => {
  const { preload, ...rest } = props
  if (!rest.src) {
    throw new Error('Image component must have a src prop')
  }
  return (
    <>
      {preload && (
        <Helmet>
          <link href={rest.src} as="image" />
        </Helmet>
      )}
      <img {...rest} />
    </>
  )
}
