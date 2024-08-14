import { BarLoader } from "react-spinners";
import { themeFile } from "../utils/ui";
import { CSSProperties } from "react";

type Props = {
  size?: number;
  color?: string;
};

const overrides: CSSProperties = {
  display: "inline-flex",
  width: 150,
  borderRadius: 0,
  backgroundImage: `radial-gradient(${themeFile.primaryColor}80 20%, transparent 20%), radial-gradient(${themeFile.primaryColor}80 20%, transparent 20%)`,
  backgroundColor: "transparent",
  backgroundPosition: "0 0, 3px 3px",
  backgroundSize: "6px 6px",
};

const ChartLoader = (props: Props) => {
  const { color, size, ...rest } = props;

  return (
    <BarLoader
      className="bar-loader"
      color={color || themeFile.primaryColor}
      height={`${size ? size : 12}px`}
      cssOverride={overrides}
      {...rest}
    />
  );
};

export default ChartLoader;
