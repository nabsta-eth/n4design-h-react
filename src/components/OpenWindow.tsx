import { IconName } from "@fortawesome/fontawesome-svg-core";
import classNames from "classnames";
import { DetailedHTMLProps, HTMLAttributes } from "react";
import { useLanguageStore } from "../context/Translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

export type OpenWindowParams = DetailedHTMLProps<
  HTMLAttributes<HTMLSpanElement>,
  HTMLSpanElement
> & {
  to: string;
  title: string;
  name?: string;
  size?: string;
  height?: number;
  width?: number;
  wrapperClasses?: string;
  linkClasses?: string;
  icon?: IconName;
  disabled?: boolean;
};

export const OpenWindow = (props: OpenWindowParams) => {
  const { t } = useLanguageStore();
  const openWindow = (openProps: OpenWindowParams) => {
    const heightParam = openProps.height ? `,height=${openProps.height}` : "";
    const widthParam = openProps.width ? `,width=${openProps.width}` : "";
    const paramString = `noopener,noreferrer,status=0,toolbar=0,menubar=0${heightParam}${widthParam}`;

    window.open(openProps.to, openProps.name || "", paramString);
  };

  return (
    <div className={classNames(props.className, props.wrapperClasses)}>
      <span
        onClick={props.disabled ? undefined : () => openWindow(props)}
        className={classNames("hfi-link", props.linkClasses)}
        data-uk-tooltip={`title: ${t.openInSeparateWindow}; pos: bottom;`}
        style={props.size ? { fontSize: props.size } : undefined}
      >
        <FontAwesomeIcon
          icon={["fal", props.icon ? props.icon : "external-link-square"]}
        />
      </span>
    </div>
  );
};
