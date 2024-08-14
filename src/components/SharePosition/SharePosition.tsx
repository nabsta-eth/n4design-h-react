import classNames from "classnames";
import ButtonSmart from "../ButtonSmart/ButtonSmart";
import PairDisplay from "@handle-fi/react-components/dist/components/PairDisplay/PairDisplay";
import classes from "./SharePosition.module.scss";
import { Fragment, createRef, memo, useMemo, useState } from "react";
import {
  CreateFileReturnProps,
  createImageDataToShare,
  share,
} from "../../utils/share";
import { useUiStore } from "../../context/UserInterface";
import { useMediaQuery as useReactResponsiveMediaQuery } from "react-responsive";
import { useLanguageStore } from "../../context/Translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { pairToString } from "handle-sdk/dist/utils/general";
import { copyBlobToClipboard } from "../../utils/copyBlobToClipboard";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { Pair } from "handle-sdk/dist/types/trade";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { pairToHyphenatedDisplayString } from "../../utils/trade/toDisplayPair";
import { Network } from "handle-sdk";
import { TranslationMap } from "src/types/translation";
import Button from "../Button";

type Props = {
  pair: Pair;
  isLong: boolean;
  entryPriceDisplay: string;
  markPriceDisplay: string;
  pnlPercentDisplay: string;
};

const SharePosition = memo(
  ({
    pair,
    isLong,
    entryPriceDisplay,
    markPriceDisplay,
    pnlPercentDisplay,
  }: Props) => {
    const { isMobile } = useUiStore();
    const refToShare = createRef<HTMLImageElement>();
    const { t } = useLanguageStore();
    const network = useConnectedNetwork();
    const instrument = useInstrumentOrThrow(pairToString(pair));
    const hasProfit = Number(pnlPercentDisplay) > 0;
    const positionSide = isLong ? t.long : t.short;
    const shareTitle = `I just aped ${positionSide} ${pairToString(
      pair,
    )} at v2.handle.fi/trade.`;
    const shareText = `#yolo #trooperftw #deFX (42,🦍)`;
    const shareFileName = `sharePosition-${pairToHyphenatedDisplayString(
      pair,
    )}.png`;
    const is320pxOrWider = useReactResponsiveMediaQuery({
      query: `(min-width: 320px)`,
    });
    const isSmaller = isMobile && is320pxOrWider;
    const isEvenSmaller = isMobile && !is320pxOrWider;
    const shouldHideQuote = instrument.hideQuoteSymbolLogo;
    const pairDisplaySize = "54";
    const [hasQrCodeImageLoaded, setHasQrCodeImageLoaded] = useState(false);
    const [hasLogoImageLoaded, setHasLogoImageLoaded] = useState(false);
    const [hasBgImageLoaded, setHasBgImageLoaded] = useState(false);
    const haveAllImagesLoaded = useMemo(
      () => hasQrCodeImageLoaded && hasLogoImageLoaded && hasBgImageLoaded,
      [hasQrCodeImageLoaded, hasLogoImageLoaded, hasBgImageLoaded],
    );

    const bgImage = useMemo(() => {
      const bgImage = new Image();
      bgImage.src = "/assets/images/handleShareBackground.png";
      bgImage.onload = () => setHasBgImageLoaded(true);
      return bgImage;
    }, []);

    const [shareImage] = usePromise(async () => {
      if (!refToShare.current || !haveAllImagesLoaded) {
        return;
      }
      return createImageDataToShare({
        ref: refToShare,
        t,
        title: shareTitle,
        text: `${shareTitle} ${shareText}`,
        fileName: shareFileName,
      });
    }, [refToShare?.current, hasQrCodeImageLoaded]);
    const isShareImageReady = !!shareImage?.data;

    return (
      <Fragment>
        <div
          ref={refToShare}
          style={
            hasBgImageLoaded
              ? { backgroundImage: `url(${bgImage.src})` }
              : undefined
          }
          className={classNames(
            "uk-flex uk-flex-column uk-background-cover",
            classes.shareContainer,
            {
              [classes.mobile]: isMobile,
            },
          )}
        >
          <div className="uk-flex uk-flex-between">
            <div className="uk-flex uk-flex-column uk-flex-between">
              <div>
                {pair && (
                  <div className="uk-flex">
                    <PairDisplay
                      noAssets
                      pair={pair}
                      size={pairDisplaySize}
                      instrument={instrument}
                    />
                    <div
                      className={classNames(
                        "uk-flex uk-flex-column uk-flex-center",
                        {
                          [classes.quoteIconHidden]: shouldHideQuote,
                        },
                      )}
                    >
                      <PairDisplay
                        noIcons
                        pair={pair}
                        size={pairDisplaySize}
                        assetsFontSize={21}
                        instrument={instrument}
                      />
                      <div
                        className={classNames(
                          "uk-flex uk-margin-remove-top uk-margin-remove-bottom",
                          classes.side,
                          {
                            "uk-h3": !isMobile,
                            "uk-h5": isSmaller,
                            "uk-h6": isEvenSmaller,
                          },
                        )}
                      >
                        <span
                          className={classNames({
                            "hfi-up": isLong,
                            "hfi-down": !isLong,
                          })}
                        >
                          {positionSide}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="uk-flex uk-flex-wrap uk-flex-column">
                <img
                  className={classes.handleLogo}
                  src="../assets/images/handle.fiLogoChimpNewCutNoBg.png"
                  alt="v2.handle.fi"
                  width={isMobile ? "50" : "75"}
                  onLoad={() => setHasLogoImageLoaded(true)}
                />
                <span
                  className={classNames("uk-margin-remove-vertical", {
                    "uk-h4": !isMobile,
                    "uk-h6": isSmaller,
                    [classes.evenSmaller]: isEvenSmaller,
                  })}
                >
                  v2.handle.fi/trade
                </span>
              </div>
            </div>

            {pair && (
              <div className="uk-flex uk-flex-column uk-flex-bottom uk-flex-between">
                <div>
                  <div
                    className={classNames(
                      "uk-flex uk-flex-right uk-flex-middle uk-margin-small-bottom",
                      {
                        "hfi-up": hasProfit,
                        "hfi-down": !hasProfit,
                        "uk-h1": !isMobile,
                        "uk-h3": isSmaller,
                        "uk-h4": isEvenSmaller,
                      },
                    )}
                  >
                    {`${hasProfit ? "+" : ""}${pnlPercentDisplay}%`}
                    <FontAwesomeIcon
                      icon={["far", hasProfit ? "arrow-up" : "arrow-down"]}
                      className="uk-margin-small-left"
                    />
                  </div>

                  <span
                    className={classNames(
                      "uk-flex uk-flex-right uk-margin-remove-vertical",
                      {
                        "uk-h4": !isMobile,
                        "uk-h6": isSmaller,
                        [classes.evenSmaller]: isEvenSmaller,
                      },
                    )}
                  >
                    {t.entry}:
                    <span
                      className={classNames(
                        "uk-margin-small-left uk-margin-remove-bottom",
                        {
                          "uk-h4": !isMobile,
                          "uk-h6": isSmaller,
                          [classes.evenSmaller]: isEvenSmaller,
                        },
                      )}
                    >
                      {entryPriceDisplay}
                    </span>
                  </span>

                  <span
                    className={classNames(
                      "uk-flex uk-flex-right uk-margin-remove-vertical",
                      {
                        "uk-h4": !isMobile,
                        "uk-h6": isSmaller,
                        [classes.evenSmaller]: isEvenSmaller,
                      },
                    )}
                  >
                    {t.mark}:
                    <span
                      className={classNames(
                        "uk-margin-small-left uk-margin-remove-bottom",
                        {
                          "uk-h4": !isMobile,
                          "uk-h6": isSmaller,
                          [classes.evenSmaller]: isEvenSmaller,
                        },
                      )}
                    >
                      {markPriceDisplay}
                    </span>
                  </span>
                </div>

                <div
                  className={classNames({
                    "uk-margin-top": !isMobile,
                    "uk-margin-small-top": isMobile,
                  })}
                >
                  <img
                    src="../assets/images/handleTradeQrCode.png"
                    alt="v2.handle.fi trade"
                    width={isMobile ? "80" : "100"}
                    style={isMobile ? undefined : { marginBottom: 4 }}
                    className="uk-margin-small-top"
                    onLoad={() => setHasQrCodeImageLoaded(true)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {isShareImageReady ? (
          <SharePositionImageReadyButtons
            isMobile={isMobile}
            network={network}
            isShareImageReady={isShareImageReady}
            shareImage={shareImage}
            t={t}
          />
        ) : (
          <Button
            type="secondary"
            disabled
            className={classNames(
              "uk-flex uk-flex-center uk-width-1-1 uk-margin-small-top uk-padding-remove-horizontal",
              classes.creatingButton,
              {
                [classes.mobile]: isMobile,
              },
            )}
          >
            {t.sharePositionCreatingBlobMessage}
          </Button>
        )}
      </Fragment>
    );
  },
  (prevProps, nextProps) => prevProps.pair === nextProps.pair,
);

export default SharePosition;

const SharePositionImageReadyButtons = ({
  isMobile,
  network,
  isShareImageReady,
  shareImage,
  t,
}: {
  isMobile: boolean;
  network?: Network;
  isShareImageReady: boolean;
  shareImage: CreateFileReturnProps;
  t: TranslationMap;
}) => {
  const onClickCopyToClipboard = () => {
    if (!shareImage?.blob) {
      return;
    }
    copyBlobToClipboard(shareImage.blob, t);
  };

  const onClickShare = () => {
    if (!shareImage?.data) {
      return;
    }
    share(shareImage.data);
  };

  return (
    <div
      className={classNames(
        classes.buttonCollection,
        "uk-flex uk-flex-middle hfi-button-collection uk-width-1-1 uk-margin-small-top",
        {
          [classes.mobile]: isMobile,
        },
      )}
    >
      <ButtonSmart
        type="secondary"
        network={network}
        disabled={!isShareImageReady}
        onClick={onClickShare}
        className={classNames(classes.shareButton, {
          "uk-flex-1": isMobile,
          "uk-width-expand": !isMobile,
        })}
      >
        <FontAwesomeIcon
          className="uk-margin-small-right"
          icon={["fal", "share-nodes"]}
        />
        {t.share}
      </ButtonSmart>

      <ButtonSmart
        type="secondary"
        network={network}
        disabled={!isShareImageReady}
        onClick={onClickCopyToClipboard}
        className={classNames(classes.copyButton, {
          "uk-width-expand": !isMobile,
        })}
      >
        <FontAwesomeIcon
          className="uk-margin-small-right"
          icon={["fal", "copy"]}
        />
        {t.copyToClipboard}
      </ButtonSmart>
    </div>
  );
};
