import "../../assets/styles/header.scss";
import { MobileMenu, Button } from "..";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "../../context/Account";
import { useUiStore } from "../../context/UserInterface";
import { useLanguageStore } from "../../context/Translation";
import AccountModal from "../Trade/TradeAccountModal/TradeAccountModal";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import {
  NavbarContainer,
  Navbar,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Navbar";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { Link as UIkitLink } from "@handle-fi/react-components/dist/components/handle_uikit/components/Link";
import { Image } from "@handle-fi/react-components/dist/components/handle_uikit/components/Image";
import InstallModal from "../InstallModal/InstallModal";
import { HeaderNavbar, HeaderNavbarItem } from "./HeaderNavbar";
import { RightHeaderComponents } from "./RightHeaderComponents";
import {
  FLI_DOC_LINK,
  TIPR_DOC_LINK,
  TIPR_EXPLOSION_DURATION_IN_MS,
  TIPR_ICON,
  TRADE_LEADERBOARD_ACCOUNTS,
} from "../../config/trade";
import { getIsTiprActive } from "../../utils/trade/tiprFli";
import { TiprConfetti } from "../Trade/TradeForm/TiprConfetti";
import { useIncentives } from "../../context/Incentives/Incentives";

const Header: React.FC = () => {
  const connectedNetwork = useConnectedNetwork();
  const { setShowChooseWalletModal } = useUiStore();

  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const account = useAccount() ?? ethers.constants.AddressZero;
  const moreMenuColour = getIsTiprActive() ? "orange" : undefined;

  useEffect(() => {
    if (connectedNetwork) {
      setShowChooseWalletModal(false);
    }
  }, [connectedNetwork]);

  const { t } = useLanguageStore();
  const menu: HeaderNavbarItem[] = [
    {
      name: "dashboard",
      title: t.dashboard,
      to: "/dashboard",
      tabs: ["wallet", "vaults", "transactions"],
    },
    {
      name: "trade",
      title: t.trade,
      to: "/trade",
    },

    {
      name: "convert",
      title: t.convert,
      to: "/convert",
    },
    {
      name: "borrow",
      title: t.borrow,
      to: `/borrow/multi/fxAUD/${account}`,
    },
    {
      name: "earn",
      title: t.earn,
      to: "/earn",
    },
    // Dropdown (sub-)menu for bridge, etc.
    {
      name: "more",
      title: t.more,
      color: moreMenuColour,
      badge: t.new,
      subMenu: [
        {
          name: "bridge",
          title: t.bridge,
          to: "/bridge",
          col: 1,
        },
        {
          name: "leaderboard",
          title: t.leaderboard,
          to: `/trade/leaderboard?accounts=${TRADE_LEADERBOARD_ACCOUNTS}`,
          col: 1,
        },
        {
          name: "data",
          title: t.data,
          external: true,
          to: "https://data.handle.fi",
          col: 2,
        },
        {
          name: "docs",
          title: t.docs,
          external: true,
          to: "https://docs.handle.fi",
          col: 2,
        },
        {
          name: "t0-Troopers",
          title: "t0-Troopers",
          external: true,
          to: "https://opensea.io/collection/t0-troopers",
          col: 2,
        },
      ],
      lowerSubMenu: [
        {
          name: "events",
          title: "events",
          color: moreMenuColour,
          badge: t.new,
          textOnly: true,
          col: 1,
        },
        {
          name: "tipr",
          title: "TIPR",
          color: moreMenuColour,
          icon: TIPR_ICON,
          external: true,
          to: TIPR_DOC_LINK,
          col: 1,
        },
        {
          name: "dummy",
          title: "",
          color: moreMenuColour,
          textOnly: true,
          col: 2,
        },
        {
          name: "fli",
          title: "FLI",
          color: moreMenuColour,
          icon: TIPR_ICON,
          external: true,
          to: FLI_DOC_LINK,
          col: 2,
        },
      ],
      dropdownOptions: {
        offset: 9,
        duration: 0,
      },
    },
  ];

  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const { isExploding } = useIncentives();

  return (
    <React.Fragment>
      <NavbarContainer
        id="header"
        transparent
        className={
          "uk-position-fixed uk-position-top hfi-background uk-flex uk-flex-between uk-flex-middle uk-padding-small uk-width-1-1"
        }
      >
        {/* See src/assets/styles/styles.scss class #handle #header #blur */}
        <div id="blur" />
        <Navbar left>
          <Button
            className="uk-navbar-toggle uk-hidden@l uk-padding-xsmall-left uk-padding-xsmall-right uk-margin-small-right"
            noBorder
            onClick={() => setShowMobileDrawer(true)}
          >
            <FontAwesomeIcon icon={["far", "bars"]} size="2x" />
          </Button>

          <UIkitLink
            href="../"
            className={"uk-logo uk-flex uk-flex-middle hfi-header-logo-colour"}
          >
            {" "}
            <Image
              width="40"
              uk-svg="true"
              src="/assets/images/handle.fiLogoLightNew.svg"
              className="border-50pc uk-margin-small-right"
            />
            <span className="uk-visible@m"> handle.fi </span>
            <span
              className="uk-text-small uk-margin-small-left"
              style={{ marginBottom: -2 }}
            >
              (42,🦍)
            </span>
          </UIkitLink>
          {<HeaderNavbar menu={menu} account={account} />}
        </Navbar>

        <div className="uk-flex uk-flex-right uk-flex-middle">
          {<RightHeaderComponents />}
        </div>
      </NavbarContainer>

      <MobileMenu
        show={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        menu={menu}
      />

      <AccountModal
        show={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />

      <InstallModal />
      {isExploding && <TiprConfetti duration={TIPR_EXPLOSION_DURATION_IN_MS} />}
    </React.Fragment>
  );
};

export default Header;
