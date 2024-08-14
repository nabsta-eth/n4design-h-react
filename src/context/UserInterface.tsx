import * as React from "react";
import { useSwipeable, SwipeEventData } from "react-swipeable";
import {
  BASE_THEMES,
  DEFAULT_THEME,
  MODERN_THEME_NAME_SUFFIX,
  THEMES,
} from "../config/constants";
import { useMediaQueries } from "../hooks/useMediaQueries";
import { Theme } from "../types/theme";
import {
  IS_MODERN_THEME_KEY,
  isInstalledPwaLocalStorage,
  themeLocalStorage,
} from "../utils/local-storage";
import { Browser, getBrowser, getThemeFile } from "../utils/ui";
import { Helmet } from "react-helmet";
import { useLocalStorage } from "@handle-fi/react-components/dist/hooks/useLocalStorage";
import { getActivePath } from "../utils/url";
import {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type SwipeDirection = "none" | "up" | "down" | "left" | "right";
export type SwipeProps = {
  swipeDirection: SwipeDirection;
  swipeCount: number;
};

export type UiValue = {
  showChooseWalletModal: boolean;
  setShowChooseWalletModal: (show: boolean) => void;
  isStandalone: boolean;
  isMobile: boolean;
  swipe: SwipeProps;
  isTouch: boolean;
  activeTheme: Theme;
  setActiveTheme: (theme: Theme) => void;
  isAndroid: boolean;
  isIos: boolean;
  browser: Browser;
  isUserLayoutMobile: boolean;
  setIsUserLayoutMobile: (isMobile: boolean) => void;
  isLayoutSettingsOpen: boolean;
  setIsLayoutSettingsOpen: (isOpen: boolean) => void;
  isTradePopout: boolean;
  isDarkMode: boolean;
  isModernTheme: boolean;
  setIsModernTheme: (isModernTheme: boolean) => void;
  maxMobileFavouriteMarkets: number;
  setMaxMobileFavouriteMarkets: Dispatch<SetStateAction<number>>;
};

export const UiContext = createContext<UiValue | undefined>(undefined);

export const UiProvider: FC<{
  children: ReactNode;
}> = props => {
  const [showChooseWalletModal, setShowChooseWalletModal] = useState(false);

  const [activeTheme, setActiveTheme] = useState<Theme>(
    themeLocalStorage.get() ?? DEFAULT_THEME,
  );

  useEffect(() => {
    for (let previousTheme of THEMES)
      document.documentElement.classList.remove(previousTheme);
    document.documentElement.classList.add(activeTheme);
    themeLocalStorage.set(activeTheme);
  }, [activeTheme]);

  const isTradePopout = getActivePath() === "popout";
  const isMaxMobile = useMediaQueries().maxMobile;
  const isMediaMobile =
    !isTradePopout &&
    (isMaxMobile ||
      window.matchMedia("(hover: none) and (pointer: coarse)").matches);
  const [isMobile, setIsMobile] = useLocalStorage<boolean>(
    "isMobile",
    isMediaMobile,
  );
  const isStandalone = useMediaQueries().isStandalone;
  if (isStandalone) isInstalledPwaLocalStorage.set(true);
  const isDarkMode = useMediaQueries().isDarkMode;

  const [swipe, setSwipe] = useState<SwipeProps>({
    swipeDirection: "none",
    swipeCount: 0,
  });
  // Is determined by the device size and set in Markets.tsx
  const [maxMobileFavouriteMarkets, setMaxMobileFavouriteMarkets] =
    useState<number>(5);

  // need to handle swipes in the same direction, hence the swipeCount.
  // if rotated, need to convert direction.
  const swipeHandlers = useSwipeable({
    onSwiped: (swipeEvent: SwipeEventData) => {
      const currentSwipeDirection = swipe.swipeDirection as SwipeDirection;
      const newSwipeDirection = swipeEvent.dir.toLowerCase() as SwipeDirection;
      const swipeCountDelta =
        newSwipeDirection === currentSwipeDirection ? 1 : 0;

      setSwipe({
        swipeDirection: newSwipeDirection,
        swipeCount: swipe.swipeCount + swipeCountDelta,
      });
    },
  });

  // to implement portrait for mobile, CSS is used to rotate the HTML
  // so we need to set the vertical height based upon width in that case
  const setVhProperty = () => {
    const isLandscapeMobile =
      isMobile &&
      isStandalone &&
      window.matchMedia("(orientation: landscape)").matches;

    // using window object dimensions does not suffice for mobile browsers
    // so use content dimensions instead
    document.documentElement.style.setProperty(
      "--true-viewport-height",
      `${
        isLandscapeMobile
          ? document.documentElement.clientWidth
          : document.documentElement.clientHeight
      }px`,
    );
  };
  window.onload = setVhProperty;
  window.onresize = setVhProperty;

  useEffect(() => {
    setIsMobile(isMediaMobile);
    setVhProperty();
  }, [isMediaMobile]);

  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const isAndroid = !!navigator.userAgent.match(/Android/i);
  const isIos =
    !!navigator.userAgent.match(/iPhone/i) ||
    !!navigator.userAgent.match(/iPad/i) ||
    !!navigator.userAgent.match(/Macintosh/i);
  const browser = getBrowser();

  // isUserLayoutMobile overrides the setting of mobile layout
  // when chosen and set in the MobileSettings route or SettingsModal.
  const [isUserLayoutMobile, setIsUserLayoutMobile] = useState(isMediaMobile);
  useEffect(() => {
    if (isUserLayoutMobile && !isMobile) setIsMobile(true);
    if (!isUserLayoutMobile && isMobile) setIsMobile(false);
  }, [isUserLayoutMobile]);

  // isLayoutSettingsOpen is set when the user chooses to change the layout
  // to ensure that the MobileSettings route or the desktop SettingsModal
  // remains open after the user has chosen to change layout.
  const [isLayoutSettingsOpen, setIsLayoutSettingsOpen] =
    useState<boolean>(false);

  // Ensures that the modal is closed if there is a switch to mobile -
  // it is shown but as a route on mobile, not as a modal.
  useEffect(() => {
    if (isMobile) {
      setShowChooseWalletModal(false);
    }
  }, [isMobile]);

  const [isModernTheme, setIsModernTheme] = useLocalStorage(
    IS_MODERN_THEME_KEY,
    !BASE_THEMES.includes(activeTheme),
  );

  const value = useMemo(
    () => ({
      showChooseWalletModal,
      setShowChooseWalletModal,
      isStandalone,
      isMobile,
      swipe,
      isTouch,
      activeTheme,
      setActiveTheme,
      isAndroid,
      isIos,
      browser,
      isUserLayoutMobile,
      setIsUserLayoutMobile,
      isLayoutSettingsOpen,
      setIsLayoutSettingsOpen,
      isTradePopout,
      isDarkMode,
      isModernTheme,
      setIsModernTheme,
      maxMobileFavouriteMarkets,
      setMaxMobileFavouriteMarkets,
    }),
    [
      showChooseWalletModal,
      setShowChooseWalletModal,
      isStandalone,
      isMobile,
      swipe,
      isTouch,
      activeTheme,
      setActiveTheme,
      isAndroid,
      isIos,
      browser,
      isUserLayoutMobile,
      setIsUserLayoutMobile,
      isLayoutSettingsOpen,
      setIsLayoutSettingsOpen,
      isTradePopout,
      isDarkMode,
      isModernTheme,
      maxMobileFavouriteMarkets,
    ],
  );

  const manifestFileName = `${activeTheme.replace(
    MODERN_THEME_NAME_SUFFIX,
    "",
  )}-manifest.json`;

  return (
    <UiContext.Provider value={value}>
      <Helmet>
        <link rel="manifest" id="manifest" href={`/${manifestFileName}`} />
        <meta
          name="theme-color"
          content={getThemeFile(activeTheme).backgroundColor}
        />
        <meta
          name="msapplication-TileColor"
          content={getThemeFile(activeTheme).backgroundColor}
        />
      </Helmet>
      <div {...swipeHandlers}>{props.children}</div>
    </UiContext.Provider>
  );
};

export const useUiStore = () => {
  const context = useContext(UiContext);

  if (context === undefined) {
    throw new Error("useUiStore must be used within a UiProvider");
  }
  return context;
};
