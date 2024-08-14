import { Fragment, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useUiStore } from "../../context/UserInterface";
import classNames from "classnames";
import classes from "./BottomTaskbar.module.scss";
import { mobileMenu, MobileMenuItem } from "./MobileMenu";
import { IconName } from "@fortawesome/fontawesome-common-types";
import Holdable from "../Holdable";
import { useDoubleTap } from "use-double-tap";
import { useUiMobileStore } from "../../context/UserInterfaceMobile";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { uniqueId } from "../../utils/general";
import InstallModal from "../InstallModal/InstallModal";
import { getActivePath } from "../../utils/url";
import { useTrade } from "../../context/Trade";
import { TiprConfetti } from "../Trade/TradeForm/TiprConfetti";
import { TIPR_EXPLOSION_DURATION_IN_MS } from "../../config/trade";
import { useIncentives } from "../../context/Incentives/Incentives";

type Event =
  | React.PointerEvent<HTMLDivElement>
  | React.TouchEvent<HTMLDivElement>;

// The index of the home button/route in the mobileMenu array
const indexOfHomeRoute = mobileMenu.findIndex(item => item.isHome);

const BottomTaskbar: React.FC = () => {
  const { isMobile, swipe } = useUiStore();
  const { activeMenuItem, setActiveMenuItem } = useUiMobileStore();
  const { setShowMarketChoiceModal } = useTrade();

  const setMenuItemByIndex = (nextIx: number) => {
    if (nextIx !== indexOfHomeRoute) {
      setShowMarketChoiceModal(false);
    }
    setActiveMenuItem(nextIx);
  };

  useEffect(() => {
    if (!isMobile || !swipe.swipeDirection) return;
    if (
      swipe.swipeDirection === "none" ||
      swipe.swipeDirection === "up" ||
      swipe.swipeDirection === "down"
    )
      return;

    const swipeDirectionDelta = swipe.swipeDirection === "left" ? 1 : -1;
    let nextIx = activeMenuItem + swipeDirectionDelta;
    if (nextIx === mobileMenu.length) nextIx = mobileMenu.length - 1;
    else if (nextIx < 0) nextIx = 0;

    const nextItem = mobileMenu[nextIx];
    const nextTo = nextItem.to ? nextItem.to : `/${nextItem.title}`;

    if (nextTo && nextIx !== activeMenuItem) {
      setMenuItemByIndex(nextIx);
    }
  }, [isMobile, swipe]);

  const activePath = getActivePath();
  useEffect(() => {
    if (activePath === "") {
      setMenuItemByIndex(indexOfHomeRoute);
    }
  }, [activePath, setMenuItemByIndex]);
  const { isExploding } = useIncentives();

  return (
    <Fragment>
      <div
        id="mobile-bottom-taskbar"
        className={classNames(
          "uk-position-fixed uk-position-bottom uk-flex uk-flex-middle uk-width-expand",
          classes.taskbar,
        )}
        style={mobileMenu.length === 1 ? { display: "none" } : undefined}
      >
        {mobileMenu
          .filter(item => !item.hide)
          .map((taskbarItem, ix) => (
            <TaskbarItem
              key={ix}
              item={taskbarItem}
              ix={ix}
              setMenuItemByIndex={setMenuItemByIndex}
            />
          ))}
      </div>
      <InstallModal />
      {isExploding && <TiprConfetti duration={TIPR_EXPLOSION_DURATION_IN_MS} />}
    </Fragment>
  );
};

type TaskbarItemProps = {
  item: MobileMenuItem;
  ix: number;
  setMenuItemByIndex: (ix: number) => void;
};

const TaskbarItem = (props: TaskbarItemProps) => {
  const { isAndroid, isStandalone } = useUiStore();
  const navigate = useNavigate();
  const { setVerticalSwipeIndex, activeMenuItem } = useUiMobileStore();
  const { setShowMarketChoiceModal } = useTrade();

  const onHold = () => {
    navigate("/chat");
  };

  const doubleTapToMarkets = useDoubleTap((_e: Event) => {
    setShowMarketChoiceModal(false);
    setVerticalSwipeIndex(0);
  });

  const isActive = props.item.title === mobileMenu[activeMenuItem].title;

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-middle uk-flex-center uk-flex-1",
        classes.taskbarItem,
        {
          [classes.android]: isAndroid,
          [classes.notStandalone]: !isStandalone,
          [classes.active]: isActive,
        },
      )}
    >
      <RouterLink
        id={`taskbar-menu-${props.item.title}-button-${uniqueId(5)}`}
        tabIndex={-1}
        to={props.item.to || props.item.title}
        className={classNames({
          [classes.disabled]: props.item.disabled,
          [classes.active]: isActive,
        })}
        onClick={
          props.item.disabled || isActive
            ? undefined
            : () => props.setMenuItemByIndex(props.ix)
        }
      >
        {props.item.holdable && (
          <Holdable
            onHold={() => {
              onHold();
            }}
            timeout={300}
            {...doubleTapToMarkets}
          >
            <TaskbarElement element={props.item} />
          </Holdable>
        )}

        {!props.item.holdable && <TaskbarElement element={props.item} />}
      </RouterLink>
    </div>
  );
};

type TaskbarElementProps = {
  element: MobileMenuItem;
};

const TaskbarElement = (props: TaskbarElementProps) => {
  const { activeMenuItem } = useUiMobileStore();
  const faFontClass = () => {
    if (props.element.customIcon) return "fak";
    if (props.element.title === mobileMenu[activeMenuItem].title) return "far";
    return "fal";
  };

  return (
    <FontAwesomeIcon
      className={classNames(classes.taskbarIcon, {
        [classes.homeIcon]: props.element.title === "",
        [classes.customIcon]: props.element.title !== "",
      })}
      icon={[faFontClass(), props.element.icon as IconName]}
    />
  );
};

export default BottomTaskbar;
