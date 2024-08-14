import React, { useState, useLayoutEffect } from "react";
import classNames from "classnames";
import classes from "./MobileMenu.module.scss";
import { useNavigate } from "react-router-dom";
import { Image } from "@handle-fi/react-components/dist/components/handle_uikit/components/Image";
import globals from "../../assets/styles/globals.module.scss";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

type NavLink = {
  title: string;
  to?: string;
  link?: string;
  subMenu?: {
    title: string;
    to?: string;
  }[];
};

type Props = {
  show: boolean;
  menu: NavLink[];
  onClose: () => void;
};

const MobileMenu: React.FC<Props> = props => {
  const navigate = useNavigate();

  const onClick = (to: string) => {
    if (to.startsWith("http")) {
      window.location.href = to;
    } else {
      navigate(to);
    }

    props.onClose();
  };

  const useWindowSize = () => {
    const [size, setSize] = useState({
      windowWidth: 0,
      windowHeight: 0,
    });

    useLayoutEffect(() => {
      const updateSize = () => {
        setSize({
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        });

        if (window.innerWidth >= Number(globals.mobileMenuBreakpoint))
          props.onClose();
      };

      window.addEventListener("resize", updateSize);
      updateSize();

      return () => window.removeEventListener("resize", updateSize);
    }, []);
    return size;
  };

  useWindowSize();

  return (
    <React.Fragment>
      <div
        className={classNames(classes.menu, {
          [classes.menuOpen]: !!props.show,
        })}
      >
        <ul className="uk-nav">
          <li
            key="mobile-menu-header"
            className={classNames(
              classes.header,
              "uk-position-relative uk-position-left uk-flex uk-flex-middle uk-margin-bottom",
            )}
          >
            <Image
              width="32"
              uk-svg="true"
              src="/assets/images/handle.fiLogoLightNew.svg"
              className="uk-margin-small-right border-50pc"
            />
            <span className="uk-h4 uk-margin-remove-vertical">handle.fi</span>
          </li>

          {props.menu.map(link =>
            link.subMenu ? (
              <li key={link.title} className="uk-parent hfi-parent">
                <span>
                  {link.title}{" "}
                  <FontAwesomeIcon icon={["fal", "chevron-down"]} />
                </span>
                <ul className="uk-nav-sub">
                  {link.subMenu.map(subMenuLink => (
                    <li
                      key={`${link.title}-${subMenuLink.title}`}
                      onClick={() =>
                        onClick(subMenuLink.to || subMenuLink.title)
                      }
                      className="hfi-mobile-menu-item uk-position-relative uk-position-left"
                    >
                      {subMenuLink.title}
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li
                key={link.title}
                onClick={() => onClick(link.to || link.title)}
                className="hfi-mobile-menu-item"
              >
                {link.title}
              </li>
            ),
          )}
        </ul>
      </div>
      {props.show && (
        <div className={classNames(classes.overlay)} onClick={props.onClose} />
      )}
    </React.Fragment>
  );
};

export default MobileMenu;
