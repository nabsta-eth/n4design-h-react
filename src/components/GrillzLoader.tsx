import classNames from "classnames";
import React from "react";
import { useLanguageStore } from "../context/Translation";
import GrillzLoaderImage from "./GrillzLoaderImage";

export type GrillzLoaderProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  wrapperClassNames?: string;
  contentClassNames?: string;
  contentStyle?: object;
  hideLoadingText?: boolean;
};

const GrillzLoader: React.FC<GrillzLoaderProps> = ({
  wrapperClassNames,
  contentClassNames,
  contentStyle,
  hideLoadingText,
  ...rest
}) => {
  const { t } = useLanguageStore();
  return (
    <div className={classNames("grillz-loading-wrapper", wrapperClassNames)}>
      <div
        className={classNames("grillz-loading-content", contentClassNames)}
        style={contentStyle ? contentStyle : undefined}
      >
        <GrillzLoaderImage {...rest} />
        {hideLoadingText ? "" : `${t.loading}...`}
      </div>
    </div>
  );
};

export default GrillzLoader;
