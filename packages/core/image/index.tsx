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

export const BackgroundImage = (props: ImageProps) => {
  const { preload, src, ...rest } = props;
  if (!src) {
    throw new Error("BackgroundImage component must have a src prop");
  }
  preload && ReactDom.preload(src, { as: "image" });
  return (
    <div
      style={{
        backgroundImage: `url(${src})`,
      }}
      {...rest}
    />
  );
};
