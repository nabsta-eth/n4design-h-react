import { Fragment, HTMLAttributes, useEffect, useRef, useState } from "react";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import classes from "./TiprButton.module.scss";
import classNames from "classnames";
import { bnToDisplayString } from "../../utils/format";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { Dropdown } from "@handle-fi/react-components/dist/components/handle_uikit/components/Dropdown";
import UIkit from "uikit";
import { useLanguageStore } from "../../context/Translation";
import {
  TIPR_DOC_LINK,
  TIPR_EXPLOSION_DURATION_IN_MS,
  TIPR_EXPLOSION_INTERVAL_DELAY_IN_MS,
  TIPR_ICON,
  TIPR_NOTIFICATION_POSITION,
  TIPR_NOTIFICATION_TIMEOUT_IN_SECONDS,
  TIPR_WIN_ICON,
  TRADE_LP_DEFAULT_CURRENCY_SYMBOL,
} from "../../config/trade";
import { useIncentives } from "../../context/Incentives/Incentives";
import { AMOUNT_DECIMALS } from "handle-sdk/dist/components/trade";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { BigNumber, constants } from "ethers";
import { formatAmount } from "handle-sdk/dist/components/trade/reader";
import { IncentiveTransactionOutput } from "../../context/Incentives/api";
import { TranslationMap } from "../../types/translation";
import {
  bigNumberToFloat,
  getLocaleNumberSeparators,
} from "../../utils/general";
import { USD_DISPLAY_DECIMALS } from "../../utils/trade";
import { usePrevious } from "../../hooks/usePrevious";

type Props = HTMLAttributes<HTMLButtonElement>;

const DEFAULT_NON_BONUS_ELIGIBILITY_FRACTION = 0.25;

export const TiprButton = (props: Props) => {
  const { t } = useLanguageStore();
  const { tiprState } = useIncentives();
  const tiprButtonId = "tiprButton";
  const tiprDropdownId = `${tiprButtonId}Dropdown`;
  const tiprButtonDropdownOffset = 8;
  const tiprVeForex = tiprState?.eligibility?.veForex.has ?? 0;
  const tiprT0TrooperNfts = tiprState?.eligibility?.t0Trooper.has ?? 0;
  const tiprEligible100Percent =
    tiprState?.eligibility?.veForex.isMet ||
    tiprState?.eligibility?.t0Trooper.isMet;
  const tiprEligibilityPercentForUser = tiprEligible100Percent
    ? 100
    : DEFAULT_NON_BONUS_ELIGIBILITY_FRACTION * 100;
  const tiprEligibilityMessage = t.tiprEligibilityMessage.replace(
    "#eligibility#",
    `${tiprEligibilityPercentForUser}%`,
  );

  const countUpRef = useRef<HTMLInputElement>(null);
  const prevTiprBalance = usePrevious(tiprState?.balance);
  let countUpAnimation: any;
  useEffect(() => {
    initCountUp();
  }, [countUpRef?.current, tiprState?.balance]);

  const [balanceColour, setBalanceColour] = useState<"up" | "down" | null>();
  const initCountUp = async () => {
    if (!countUpRef?.current) {
      return;
    }
    const countUpModule = await import("countup.js");
    countUpAnimation = new countUpModule.CountUp(
      countUpRef?.current,
      bigNumberToFloat(tiprState?.balance ?? constants.Zero, AMOUNT_DECIMALS),
      {
        startVal: bigNumberToFloat(
          prevTiprBalance ?? constants.Zero,
          AMOUNT_DECIMALS,
        ),
        decimalPlaces: USD_DISPLAY_DECIMALS,
        separator: getLocaleNumberSeparators().wholeNumberSeparator,
        decimal: getLocaleNumberSeparators().decimalSeparator,
        onStartCallback: () =>
          setBalanceColour(
            tiprState?.balance.gt(prevTiprBalance ?? constants.Zero)
              ? "up"
              : "down",
          ),
        onCompleteCallback: () => setBalanceColour(null),
      },
    );
    if (!countUpAnimation.error) {
      countUpAnimation.start();
    } else {
      console.error(countUpAnimation.error);
    }
  };

  return (
    <Fragment>
      <Button
        id={tiprButtonId}
        color="orange"
        type="secondary"
        size="small"
        className={classNames(
          classes.tiprButton,
          "uk-position-relative uk-flex uk-flex-middle",
          props.className,
        )}
        onClick={() => UIkit.dropdown(`#${tiprDropdownId}`).show()}
      >
        <FontAwesomeIcon icon={TIPR_ICON} />
        <span className={classNames("uk-margin-small-left")}>TIPR:</span>
        <span className={classNames("uk-margin-xsmall-left")}>
          {tiprState?.balance ? (
            <span
              ref={countUpRef}
              className={classNames({
                [`hfi-${balanceColour}`]: balanceColour,
              })}
            >
              {"-"}
            </span>
          ) : (
            "-"
          )}
        </span>
        <span className={classNames("uk-margin-xsmall-left", classes.smaller)}>
          {TRADE_LP_DEFAULT_CURRENCY_SYMBOL}
        </span>
      </Button>

      <Dropdown
        id={tiprDropdownId}
        className={classes.tiprDropdown}
        options={`mode: click; delay-hide: 0; pos: bottom-left; boundary: #${tiprButtonId}; boundary-align: true; offset: ${tiprButtonDropdownOffset};`}
      >
        <div className={classNames(classes.tiprDropdownContent)}>
          <div
            className={classNames(
              "uk-margin-small-bottom",
              classes.tiprDropdownRewardEligibility,
            )}
          >
            {tiprEligibilityMessage}
          </div>

          <div
            className={classNames("uk-margin-xsmall-top", classes.divider)}
          />

          <div className={classNames("uk-margin-small-top")}>
            <a
              className={classNames(classes.tiprLink)}
              href={TIPR_DOC_LINK}
              target="_blank"
            >
              {t.tiprBonusCriteriaHeader}
              <FontAwesomeIcon
                className="uk-margin-small-left"
                icon={["far", "external-link"]}
              />
            </a>
          </div>

          <div
            className={classNames(
              "uk-flex uk-flex-between uk-width-expand",
              classes.tiprDropdownIndent,
              {
                [classes.halfOpacity]: !tiprState?.eligibility?.veForex.isMet,
              },
            )}
          >
            <span>{t.veForexHeld}</span>
            <div className="uk-flex uk-flex-middle">
              {tiprVeForex}
              <FontAwesomeIcon
                className={classNames("uk-margin-small-left", classes.checkbox)}
                icon={[
                  "fal",
                  tiprState?.eligibility?.veForex.isMet
                    ? "check-square"
                    : "square",
                ]}
              />
            </div>
          </div>

          <div
            className={classNames(
              "uk-flex uk-flex-between uk-width-expand",
              classes.tiprDropdownIndent,
              {
                [classes.halfOpacity]: !tiprState?.eligibility?.t0Trooper.isMet,
              },
            )}
          >
            <span>t0-Trooper NFTs</span>
            <div className="uk-flex uk-flex-middle">
              {tiprT0TrooperNfts}
              <FontAwesomeIcon
                className={classNames("uk-margin-small-left", classes.checkbox)}
                icon={[
                  "fal",
                  tiprState?.eligibility?.t0Trooper.isMet
                    ? "check-square"
                    : "square",
                ]}
              />
            </div>
          </div>
        </div>
      </Dropdown>
    </Fragment>
  );
};
