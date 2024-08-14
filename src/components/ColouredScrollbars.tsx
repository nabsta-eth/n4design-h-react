import React, { ReactNode, useCallback } from "react";
import { positionValues, Scrollbars } from "react-custom-scrollbars-2";
import { getThemeFile } from "../utils/ui";
import { useUiStore } from "../context/UserInterface";
import classNames from "classnames";

export type Props = {
  style?: React.CSSProperties;
  onUpdate?: (values: positionValues) => any;
  universal?: boolean;
  children?: ReactNode;
  classes?: string;
};

const ColouredScrollbars = (props: Props) => {
  const { activeTheme } = useUiStore();
  const renderView = useCallback(
    ({ style, ...props }: any) => (
      <div className="box" style={{ ...style }} {...props} />
    ),
    [],
  );
  const themeFile = getThemeFile(activeTheme);
  const renderThumb = useCallback(({ style, ...props }: any) => {
    const thumbStyle = {
      color: themeFile.backgroundColor,
      backgroundColor: `${themeFile.primaryColor}20`,
      borderRadius: "calc(var(--app-border-radius) / 3)",
      zIndex: 2,
    };
    return <div style={{ ...style, ...thumbStyle }} {...props} />;
  }, []);
  return (
    <Scrollbars
      className={classNames("scrollbars", props.classes)}
      renderView={renderView}
      renderThumbHorizontal={renderThumb}
      renderThumbVertical={renderThumb}
      universal={true}
      {...props}
    />
  );
};

export default ColouredScrollbars;
