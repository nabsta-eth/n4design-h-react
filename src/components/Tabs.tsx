import classNames from "classnames";
import { CSSProperties, KeyboardEvent, createRef } from "react";
import {
  isKeyPressedEnterOrSpace,
  isKeyPressedTabLeftNavigation,
  isKeyPressedTabNavigation,
  isKeyPressedTabRightNavigation,
} from "../utils/ui";

type Props<T> = {
  wrapperClassName?: string;
  tabsClassName?: string;
  tabClassName?: string;
  tabs: readonly T[];
  active: T;
  onClick: (id: T) => void;
  style?: CSSProperties;
  tabContent?: (tab: T) => JSX.Element;
};

const Tabs = <T extends string>(props: Props<T>) => {
  const tabsWithRef = props.tabs.map(t => {
    return {
      name: t,
      ref: createRef<HTMLSpanElement>(),
    };
  });

  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>, t: T) => {
    if (isKeyPressedEnterOrSpace(e)) return props.onClick(t);

    if (!isKeyPressedTabNavigation(e)) return;

    e.preventDefault();
    const index = props.tabs.indexOf(t);
    if (isKeyPressedTabLeftNavigation(e)) {
      if (index > 0) return tabsWithRef[index - 1].ref.current?.focus();
    }

    if (isKeyPressedTabRightNavigation(e)) {
      if (index < tabsWithRef.length)
        return tabsWithRef[index + 1].ref.current?.focus();
    }
  };

  return (
    <div
      className={classNames("tabs-class", props.wrapperClassName)}
      style={props.style}
    >
      <ul className={`uk-tab ${props.tabsClassName}`}>
        {tabsWithRef.map(tab => {
          return (
            <li
              key={tab.name}
              className={classNames(props.tabClassName, {
                "uk-active": props.active === tab.name,
              })}
            >
              <span
                tabIndex={0}
                role="button"
                data-active={props.active === tab.name || undefined}
                ref={tab.ref}
                onClick={() => props.onClick(tab.name)}
                onKeyDown={e => onKeyDown(e, tab.name)}
              >
                {props.tabContent ? props.tabContent(tab.name) : tab.name}{" "}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Tabs;
