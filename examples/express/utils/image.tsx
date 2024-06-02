import ReactDom from "react-dom";

export type ImageProps = {
  preload?: boolean;
  src: string;
} & React.ImgHTMLAttributes<HTMLImageElement>;

export const Image = (props: ImageProps) => {
  const { preload, ...rest } = props;
  if (!rest.src) {
    throw new Error("Image component must have a src prop");
  }
  preload && ReactDom.preload(rest.src, { as: "image" });
  return <img {...rest} />;
};

