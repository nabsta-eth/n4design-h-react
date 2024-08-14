import classnames from "classnames";
import { themeFile } from "../utils/ui";

export type PageTitleProps = React.HTMLAttributes<HTMLDivElement> & {
  text: string;
  sticky?: boolean;
};

const PageTitle: React.FC<PageTitleProps> = props => {
  const { text, children, className, sticky, ...rest } = props;
  return (
    <div
      className={classnames("uk-flex uk-margin-small-bottom", {
        [`${className}`]: className,
      })}
      style={
        sticky
          ? {
              paddingBottom: "10px",
              backgroundColor: `${themeFile.backgroundColor}`,
            }
          : undefined
      }
      data-uk-sticky={sticky ? "offset: 56" : undefined}
      {...rest}
    >
      <h2
        className={classnames("uk-h2 uk-margin-remove-vertical", {
          "uk-margin-small-right": text,
        })}
      >
        {text}
      </h2>
      {children}
    </div>
  );
};

export default PageTitle;
