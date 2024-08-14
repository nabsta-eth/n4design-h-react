import { IconName } from "@fortawesome/fontawesome-svg-core";
import { ReactNode } from "react";
import Convert from "../../navigation/Convert";
import MobileHome from "../../navigation/MobileHome";
import TradeForm from "../Trade/TradeForm/TradeForm";
import MobileTransactions from "./MobileTransactions";
import MobileDashboard from "./MobileDashboard";

type HandleIconName = "handleregular" | "trade";

export type MobileMenuItem = {
  title: string;
  to?: string;
  icon: IconName | HandleIconName;
  customIcon?: boolean;
  disabled?: boolean;
  swipe?: boolean;
  hide?: boolean;
  active?: boolean;
  component: ReactNode;
  subordinatePaths?: string[];
  description: string;
  holdable?: boolean;
  isHome?: boolean;
};

export type MobileMenu = MobileMenuItem[];

export const mobileMenu: MobileMenu = [
  {
    title: "dashboard",
    icon: "grid-2",
    component: <MobileDashboard />,
    swipe: true,
    subordinatePaths: ["assets"],
    description: "",
    holdable: false,
  },
  {
    title: "convert",
    icon: "right-left",
    component: <Convert />,
    swipe: true,
    description: "convert tokens",
    holdable: false,
  },
  {
    title: "",
    icon: "handleregular",
    customIcon: true,
    component: <MobileHome />,
    swipe: true,
    description: "",
    holdable: true,
    isHome: true,
  },
  {
    title: "trade",
    icon: "trade",
    customIcon: true,
    component: <TradeForm />,
    swipe: true,
    description: "trade tokens",
    holdable: false,
  },
  {
    title: "positions",
    icon: "list-ul",
    component: <MobileTransactions />,
    swipe: true,
    subordinatePaths: [
      "shareposition",
      "editposition",
      "closeposition",
      "showposition",
    ],
    description: "show positions & trades",
    holdable: false,
  },
];
