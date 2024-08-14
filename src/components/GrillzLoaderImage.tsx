import { CSSProperties } from "react";

type GrillzLoaderProps = {
  className?: string;
  style?: CSSProperties;
};

const GrillzLoaderImage = (props: GrillzLoaderProps) => (
  <img
    src="/assets/images/handle.fiDancingGorilla.gif"
    alt="app.handle.fi"
    width="48"
    className={props.className}
    style={props.style}
  />
);

export default GrillzLoaderImage;
