import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import { Link } from "@handle-fi/react-components/dist/components/handle_uikit/components/Link";
import { bnToDisplayString } from "../../utils/format";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useLanguageStore } from "../../context/Translation";
import classes from "./Footer.module.scss";
import classNames from "classnames";

const Footer = () => {
  const { currentGasPrice, isDev } = useUserWalletStore();
  const { t } = useLanguageStore();
  const displayGasPrice =
    currentGasPrice && bnToDisplayString(currentGasPrice, 9, 2);

  return (
    <div
      id="footer"
      data-uk-grid
      className={classNames(
        "uk-child-width-1-1 uk-child-width-1-3@m",
        classes.footer,
      )}
    >
      <div>
        <div className="uk-flex uk-flex-left uk-flex-middle">
          {displayGasPrice && (
            <div className="uk-text-right">
              <span data-uk-tooltip={`title: ${t.gasPrice}; pos: top-left;`}>
                <FontAwesomeIcon
                  icon={["far", "gas-pump"]}
                  className="uk-margin-small-right"
                />
                {displayGasPrice}
              </span>
            </div>
          )}
          <div
            className={classNames(
              "hfi-warning uk-flex uk-flex-middle cursor-pointer uk-text-bold",
              {
                "uk-margin-left": displayGasPrice,
              },
            )}
            uk-tooltip={`title: ${t.headerBetaTextTooltip}; pos: top-left; cls: uk-active hfi-orange;`}
          >
            <FontAwesomeIcon icon={["fal", "exclamation-triangle"]} />
            <span className="uk-margin-small-left">{t.beta}</span>
            {isDev && (
              <span
                className={classNames(
                  "uk-visible@xl uk-margin-small-left",
                  classes.version,
                )}
              >
                v{import.meta.env.VITE_APP_VERSION}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="uk-visible@m">
        <div className="uk-container uk-flex uk-flex-center uk-flex-middle uk-margin-remove-bottom uk-margin-xsmall-top">
          <Link href="https://twitter.com/handle_fi" target="_blank">
            <FontAwesomeIcon
              style={{ fontSize: "18px" }}
              icon={["fab", "x-twitter"]}
            />
          </Link>
          <Link
            className="uk-margin-left"
            href="https://discord.gg/77WDThbZJ4"
            target="_blank"
          >
            <FontAwesomeIcon
              style={{ fontSize: "18px" }}
              icon={["fab", "discord"]}
            />
          </Link>
          <Link
            className="uk-margin-left"
            href="https://github.com/handle-fi"
            target="_blank"
          >
            <FontAwesomeIcon
              style={{ fontSize: "18px" }}
              icon={["fab", "github"]}
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Footer;
