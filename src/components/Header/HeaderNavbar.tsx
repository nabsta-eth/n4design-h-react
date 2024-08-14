import { Link as RouterLink, useLocation } from "react-router-dom";
import { Navbar } from "@handle-fi/react-components/dist/components/handle_uikit/components/Navbar";
import { NavItem } from "@handle-fi/react-components/dist/components/handle_uikit/components/Nav/NavItem";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import classNames from "classnames";
import classes from "./HeaderNavbar.module.scss";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-common-types";
import { getIsFliActive, getIsTiprActive } from "../../utils/trade/tiprFli";

export type HeaderNavbarProps = {
  menu: HeaderNavbarItem[];
  account: string;
};

/**
 * @property title Display name in menu.
 * @property to Override route name (if different to title).
 * @property external External link override.
 * @property tabs Use if route has tabs like dashboard.
 * @property mobileOnly Whether to only display in mobile.
 * @property hidden Whether the item is hidden.
 * @property disabled Whether the property shows as unavailable.
 * @property subMenu Whether the item has sub items.
 * @property id An identifier for the item.
 */

type HeaderNavbarItemSubMenu = Omit<
  HeaderNavbarItem,
  "subMenu" | "lowerSubMenu" | "dropdownOptions"
> & {
  col?: number;
};
export type HeaderNavbarItem = {
  name: string;
  title: string;
  id?: string;
  to?: string;
  external?: boolean;
  tabs?: string[];
  mobileOnly?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  color?: string;
  textOnly?: boolean;
  icon?: [IconPrefix, IconName];
  subMenu?: HeaderNavbarItemSubMenu[];
  lowerSubMenu?: HeaderNavbarItemSubMenu[];
  badge?: string;
  dropdownOptions?: {
    offset?: number;
    animation?: string;
    duration?: number;
  };
};

export const HeaderNavbar = ({ menu, account }: HeaderNavbarProps) => {
  const activePath = useLocation().pathname.replace(account, "");

  const activeMenuItem = menu.find(
    menuItem =>
      (!menuItem.subMenu && activePath === menuItem.to) ||
      menuItem.subMenu?.find(
        sm => activePath === menuItem.to || activePath.includes(sm.name),
      ),
  );

  return (
    <Navbar
      className={classNames(
        "uk-flex uk-flex-middle uk-visible@l uk-margin-left",
        classes.headerNavbar,
      )}
    >
      {menu
        .filter(link => !link.mobileOnly)
        .map(link =>
          link.subMenu ? (
            <NavItem
              id={link.id ?? link.name}
              key={link.title}
              parent
              className={classNames(
                "uk-flex uk-flex-middle uk-position-relative",
                `hfi-${link.color}`,
                {
                  "uk-active": link.name === activeMenuItem?.name,
                  "uk-hidden": link.hidden,
                  "uk-disabled": link.disabled,
                },
              )}
            >
              {!!link.badge && (
                <span className={classes.badge}>{link.badge}</span>
              )}
              <a
                id={`header-menu-${link.name}`}
                href="#"
                tabIndex={0}
                className="hfi-link"
                aria-haspopup="true"
                aria-expanded="false"
              >
                {link.title}
                <FontAwesomeIcon
                  icon={["far", "chevron-down"]}
                  className={classNames(
                    "uk-margin-xsmall-left hfi-rotate-180deg-on-hover",
                    classes.chevron,
                  )}
                />
              </a>
              <div
                className="uk-flex-center uk-navbar-dropdown hfi-menu-dropdown"
                data-uk-drop={`align: left; delay-hide: 200; pos: bottom-left; offset: ${
                  link.dropdownOptions?.offset ?? -2
                }; duration: ${link.dropdownOptions?.duration};`}
              >
                <div className="uk-grid uk-child-width-1-2">
                  {link.subMenu && (
                    <SubMenu
                      link={link}
                      subMenu={link.subMenu}
                      account={account}
                    />
                  )}
                  {link.lowerSubMenu && (
                    <SubMenu
                      link={link}
                      subMenu={link.lowerSubMenu}
                      account={account}
                    />
                  )}
                </div>
              </div>
            </NavItem>
          ) : (
            <NavItem
              id={link.id ?? link.name}
              key={link.title}
              className={classNames("uk-flex uk-flex-middle", {
                "uk-active": link.name === activeMenuItem?.name,
                "uk-hidden": link.hidden,
                "uk-disabled": link.disabled,
              })}
            >
              <MenuRouterOrExternalLink
                key={link.name}
                link={link}
                account={account}
              />
            </NavItem>
          ),
        )}
    </Navbar>
  );
};

const MenuRouterOrExternalLink = ({
  link,
  subMenu,
  account,
}: {
  link: HeaderNavbarItem;
  subMenu?: HeaderNavbarItem;
  account: string;
}) => {
  const linkOrSubMenu = subMenu ?? link;
  const idPrefix = subMenu?.name ? `${link.name}-` : "";
  const id = `header-menu-${idPrefix}${linkOrSubMenu.name}`;
  if (linkOrSubMenu.textOnly) {
    return (
      <div
        className={classNames("uk-text-left", classes.textOnly, {
          [`hfi-${linkOrSubMenu.color}`]:
            linkOrSubMenu.title && linkOrSubMenu.color,
          [classes.colorBackground]: linkOrSubMenu.title === "",
        })}
      >
        <span
          className={classNames("uk-position-relative", {
            [`hfi-${linkOrSubMenu.color}`]:
              linkOrSubMenu.title && linkOrSubMenu.color,
          })}
        >
          {!!linkOrSubMenu.badge && (
            <span className={classNames(classes.badge, classes.textBadge)}>
              {linkOrSubMenu.badge}
            </span>
          )}
          {linkOrSubMenu.title ? linkOrSubMenu.title : "dummy"}
        </span>
      </div>
    );
  }
  return linkOrSubMenu.external ? (
    <MenuExternalLink
      id={id}
      to={linkOrSubMenu.to!}
      title={linkOrSubMenu.title}
      icon={linkOrSubMenu.icon}
      badge={linkOrSubMenu.badge}
      color={linkOrSubMenu.color}
    />
  ) : (
    <MenuRouterLink
      id={id}
      account={account}
      to={linkOrSubMenu.to ?? linkOrSubMenu.name}
      name={linkOrSubMenu.name}
      title={linkOrSubMenu.title}
      icon={linkOrSubMenu.icon}
      badge={linkOrSubMenu.badge}
      hidden={linkOrSubMenu.hidden}
      disabled={linkOrSubMenu.disabled}
      color={linkOrSubMenu.color}
    />
  );
};

const MenuExternalLink = ({
  id,
  to,
  title,
  color,
  icon,
  badge,
  ...rest
}: {
  id: string;
  to: string;
  title: string;
  icon?: [IconPrefix, IconName];
  badge?: string;
  color?: string;
}) => (
  <a
    id={id}
    className={classNames("hfi-link uk-position-relative", {
      [`hfi-${color}`]: color,
    })}
    tabIndex={0}
    href={to}
    rel="noreferrer"
    target="_blank"
    {...rest}
  >
    {!!badge && <span className={classes.badge}>{badge}</span>}
    {icon && <FontAwesomeIcon icon={icon} className="uk-margin-small-right" />}
    {title}
    <FontAwesomeIcon
      className="uk-margin-small-left"
      icon={["far", "external-link"]}
    />
  </a>
);

const MenuRouterLink = ({
  id,
  account,
  to,
  name,
  title,
  color,
  icon,
  badge,
  hidden,
  disabled,
  ...rest
}: {
  id: string;
  account: string;
  to: string;
  name: string;
  title: string;
  icon?: [IconPrefix, IconName];
  badge?: string;
  color?: string;
  hidden?: boolean;
  disabled?: boolean;
}) => {
  const activePath = useLocation().pathname.replace(account, "");
  return (
    <RouterLink
      id={id}
      tabIndex={0}
      className={classNames("hfi-link uk-position-relative", {
        "uk-active": activePath.includes(name),
        "uk-hidden": hidden,
        "uk-disabled": disabled,
        [`hfi-${color}`]: color,
      })}
      to={to ?? name}
      {...rest}
    >
      {!!badge && <span className={classes.badge}>{badge}</span>}
      {icon && (
        <FontAwesomeIcon icon={icon} className="uk-margin-small-right" />
      )}
      {title}
    </RouterLink>
  );
};

const SubMenu = ({
  link,
  subMenu,
  account,
}: {
  link: HeaderNavbarItem;
  subMenu: HeaderNavbarItemSubMenu[];
  account: string;
}) => {
  return (
    <>
      <div className={classNames(classes.subMenu, classes.lowerSubMenu)}>
        <ul className="uk-nav uk-navbar-dropdown-nav uk-flex uk-flex-column">
          {subMenu
            .filter(i => i.col === 1)
            .map(subMenu => {
              if (subMenu.name !== "tipr" || getIsTiprActive()) {
                return (
                  <MenuRouterOrExternalLink
                    key={`${link.name}${subMenu.name}`}
                    link={link}
                    subMenu={subMenu}
                    account={account}
                  />
                );
              }
            })}
        </ul>
      </div>
      <div className={classNames(classes.lowerSubMenu)}>
        <ul className="uk-nav uk-navbar-dropdown-nav uk-flex uk-flex-column">
          {subMenu
            .filter(i => i.col === 2)
            .map(subMenu => {
              if (subMenu.name !== "fli" || getIsFliActive()) {
                return (
                  <MenuRouterOrExternalLink
                    key={`${link.name}${subMenu.name}`}
                    link={link}
                    subMenu={subMenu}
                    account={account}
                  />
                );
              }
            })}
        </ul>
      </div>
    </>
  );
};
